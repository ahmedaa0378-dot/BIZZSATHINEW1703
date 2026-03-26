// Re-export voice functions
export { buildVoiceSystemPrompt, getVoiceResponse } from './openai-voice';
export type { VoiceConversationMessage, VoiceAIResponse } from './openai-voice';

import { BIZZSATHI_KNOWLEDGE_BASE } from './knowledge-base';
import { proxyChat, proxyChatStream } from './api-proxy';

// ========== CHATBOT ==========

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'log_income' | 'log_expense' | 'create_invoice' | 'view_report' | 'check_stock' | 'send_reminder' | 'navigate';
  data?: any;
  label: string;
}

function getLangInstruction(lang: string): string {
  switch (lang) {
    case 'hi': return 'Respond in Hindi/Hinglish. Use Rs for currency. Use "ji", "aap" respectfully.';
    case 'te': return 'Respond in Telugu. Use Rs for currency. Respectful tone.';
    case 'ta': return 'Respond in Tamil. Use Rs for currency. Respectful tone.';
    case 'gu': return 'Respond in Gujarati. Use Rs for currency. Respectful tone.';
    default: return 'Respond in English. Use Rs for currency.';
  }
}

// Detect if user message likely needs an action
function isActionIntent(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  const actionWords = [
    'sale', 'sell', 'sold', 'income', 'received', 'payment received',
    'expense', 'kharcha', 'spent', 'paid', 'bought', 'purchase',
    'invoice', 'bill', 'banao', 'create',
    'report', 'dikhao', 'show report',
    'stock', 'inventory', 'check stock',
    'navigate', 'open', 'go to', 'jaao', 'kholo',
    'add sale', 'add expense', 'log', 'entry',
    'maal', 'saman', 'becha', 'liya', 'diya',
  ];
  const hasNumber = /\d+/.test(lower);
  const hasActionWord = actionWords.some(w => lower.includes(w));
  return hasActionWord || (hasNumber && lower.length < 50);
}

export async function sendChatMessage(
  messages: ChatMessage[],
  businessContext: {
    businessName: string;
    businessType: string;
    ownerName: string;
    todayIncome: number;
    todayExpense: number;
    monthIncome: number;
    monthExpense: number;
    cashInHand: number;
    recentTransactions: string;
    pendingInvoices: number;
    pendingAmount: number;
    lowStockItems: string;
    topContacts: string;
    totalProducts: number;
    language: string;
  },
  onChunk?: (text: string) => void
): Promise<{ text: string; action?: ChatAction }> {
  const langInstruction = getLangInstruction(businessContext.language);
  const todayProfit = businessContext.todayIncome - businessContext.todayExpense;
  const monthProfit = businessContext.monthIncome - businessContext.monthExpense;
  const monthMargin = businessContext.monthIncome > 0 ? ((monthProfit / businessContext.monthIncome) * 100).toFixed(1) : '0';

  const systemPrompt = `You are BizzSathi AI — a smart business assistant for Indian MSMEs.
Speaking with ${businessContext.ownerName}, "${businessContext.businessName}" (${businessContext.businessType}).

${langInstruction}

LIVE DATA (always use these, NEVER say "I need data"):
- Today: income Rs ${businessContext.todayIncome.toLocaleString('en-IN')}, expense Rs ${businessContext.todayExpense.toLocaleString('en-IN')}, profit Rs ${todayProfit.toLocaleString('en-IN')}
- Month: income Rs ${businessContext.monthIncome.toLocaleString('en-IN')}, expense Rs ${businessContext.monthExpense.toLocaleString('en-IN')}, profit Rs ${monthProfit.toLocaleString('en-IN')} (margin ${monthMargin}%)
- Cash in hand: Rs ${businessContext.cashInHand.toLocaleString('en-IN')}
- Pending: ${businessContext.pendingInvoices} invoices (Rs ${businessContext.pendingAmount.toLocaleString('en-IN')})
- Low stock: ${businessContext.lowStockItems || 'None'}
- Products: ${businessContext.totalProducts}
- Contacts: ${businessContext.topContacts || 'None'}
- Recent: ${businessContext.recentTransactions}

${BIZZSATHI_KNOWLEDGE_BASE}

=== CRITICAL ACTION INSTRUCTIONS ===

When the user wants to DO something (log sale, expense, create invoice, check stock, see reports, navigate), you MUST include an ACTION_JSON line at the very end.

ACTION_JSON RULES:
- It MUST be the LAST line of your response
- It MUST start with exactly: ACTION_JSON:
- It MUST be followed by valid JSON with NO line breaks inside the JSON
- Do NOT wrap it in backticks, code blocks, or quotes
- Do NOT add any text after the ACTION_JSON line
- The JSON must have: type, data, label

MANDATORY ACTION TRIGGERS — if the user says ANY of these, you MUST include ACTION_JSON:

INCOME/SALE keywords: sale, sell, sold, income, received, becha, bika, aaya, payment aaya, mila, kamayi, profit entry
→ ACTION_JSON:{"type":"log_income","data":{"amount":NUMBER,"category":"CATEGORY","description":"DESC","payment_method":"Cash","contact_name":null},"label":"Log Rs NUMBER Income"}

EXPENSE keywords: expense, kharcha, spent, paid, bought, purchase, liya, diya, bheja, cost, bill paid
→ ACTION_JSON:{"type":"log_expense","data":{"amount":NUMBER,"category":"CATEGORY","description":"DESC","payment_method":"Cash","contact_name":null},"label":"Log Rs NUMBER Expense"}

INVOICE keywords: invoice, bill banao, invoice banao, bill create, challan
→ ACTION_JSON:{"type":"create_invoice","data":{"path":"/invoices/create"},"label":"Create Invoice"}

REPORT keywords: report, dikhao, show report, summary dikhao, chart, graph, analysis
→ ACTION_JSON:{"type":"navigate","data":{"path":"/reports"},"label":"Open Reports"}

STOCK keywords: stock, inventory, maal, saman, stock check, godown
→ ACTION_JSON:{"type":"navigate","data":{"path":"/stock"},"label":"Check Stock"}

NAVIGATE keywords: open, go to, jaao, kholo, settings, contacts, more, profile
→ ACTION_JSON:{"type":"navigate","data":{"path":"/PATH"},"label":"Open PAGE"}

=== EXACT EXAMPLES (follow these exactly) ===

User: sale 300
Response: Rs 300 sale log karoon? Cash mein?
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sale","payment_method":"Cash","contact_name":null},"label":"Log Rs 300 Income"}

User: 500 income from Ramesh
Response: Rs 500 income from Ramesh log karta hoon.
ACTION_JSON:{"type":"log_income","data":{"amount":500,"category":"Product Sales","description":"Income from Ramesh","payment_method":"Cash","contact_name":"Ramesh"},"label":"Log Rs 500 Income"}

User: kharcha 200 petrol
Response: Rs 200 petrol kharcha log karoon?
ACTION_JSON:{"type":"log_expense","data":{"amount":200,"category":"Transport","description":"Petrol","payment_method":"Cash","contact_name":null},"label":"Log Rs 200 Expense"}

User: expense 1000 rent
Response: Rs 1,000 rent expense log kar deta hoon.
ACTION_JSON:{"type":"log_expense","data":{"amount":1000,"category":"Rent","description":"Rent payment","payment_method":"Cash","contact_name":null},"label":"Log Rs 1,000 Expense"}

User: 5000 maal liya Sharma se
Response: Rs 5,000 stock purchase from Sharma log karoon?
ACTION_JSON:{"type":"log_expense","data":{"amount":5000,"category":"Stock Purchase","description":"Maal from Sharma","payment_method":"Cash","contact_name":"Sharma"},"label":"Log Rs 5,000 Expense"}

User: 800 becha Suresh ko
Response: Rs 800 sale to Suresh log karta hoon.
ACTION_JSON:{"type":"log_income","data":{"amount":800,"category":"Product Sales","description":"Sale to Suresh","payment_method":"Cash","contact_name":"Suresh"},"label":"Log Rs 800 Income"}

User: invoice banao
Response: Invoice form kholta hoon.
ACTION_JSON:{"type":"create_invoice","data":{"path":"/invoices/create"},"label":"Create Invoice"}

User: report dikhao
Response: Reports page kholta hoon.
ACTION_JSON:{"type":"navigate","data":{"path":"/reports"},"label":"Open Reports"}

User: stock check karo
Response: Stock page kholta hoon.
ACTION_JSON:{"type":"navigate","data":{"path":"/stock"},"label":"Check Stock"}

User: aaj ka profit?
Response: Aaj ka profit Rs ${todayProfit.toLocaleString('en-IN')} hai. Income Rs ${businessContext.todayIncome.toLocaleString('en-IN')}, expense Rs ${businessContext.todayExpense.toLocaleString('en-IN')}.

User: how to add contact?
Response: Contact add karne ke liye: 1) More tab pe jaayein, 2) Contacts pe tap karein, 3) + button dabayein, 4) Name, phone, type fill karein aur Save karein.
ACTION_JSON:{"type":"navigate","data":{"path":"/contacts"},"label":"Open Contacts"}

=== GENERAL RULES ===
1. Keep responses under 3 sentences for actions, up to 5 for help/knowledge
2. NEVER use LaTeX, markdown, bullet points, or code blocks
3. NEVER show formulas — just calculate and give the answer
4. Indian number format (12,34,567), Rs symbol
5. Default payment to "Cash" unless user says UPI, card, bank, cheque, credit
6. If user mentions a number with action context, ALWAYS include ACTION_JSON
7. For data questions (profit, balance, summary), answer from LIVE DATA — no ACTION_JSON needed
8. Remember: ACTION_JSON must be plain text on the last line, not inside any formatting`;

  try {
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const allMessages = [{ role: 'system', content: systemPrompt }, ...apiMessages.slice(-8)];
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const needsAction = isActionIntent(lastUserMsg);

    // For action-likely messages: use NON-STREAMING for reliable ACTION_JSON parsing
    if (needsAction) {
      const data = await proxyChat(allMessages, { temperature: 0.15, max_tokens: 500 });
      const fullText = data.choices?.[0]?.message?.content || '';
      let result = parseActionFromResponse(fullText);

      // If we expected an action but didn't get one, retry once
      if (!result.action) {
        const retryMessages = [
          ...allMessages,
          { role: 'assistant', content: result.text },
          { role: 'user', content: 'You must include ACTION_JSON on the last line. Repeat your response with ACTION_JSON included.' },
        ];
        const retryData = await proxyChat(retryMessages, { temperature: 0.1, max_tokens: 500 });
        const retryText = retryData.choices?.[0]?.message?.content || '';
        const retryResult = parseActionFromResponse(retryText);

        if (retryResult.action) {
          // Keep original text, use retried action
          result = { text: result.text, action: retryResult.action };
        }
      }

      // Simulate streaming for smooth UX
      if (onChunk) {
        await simulateStream(result.text, onChunk);
      }
      return result;

    } else {
      // Info/help query — use streaming for better UX
      if (onChunk) {
        const fullText = await proxyChatStream(allMessages, (text) => {
          onChunk(text.split('ACTION_JSON')[0].trim());
        }, { temperature: 0.3, max_tokens: 500 });
        return parseActionFromResponse(fullText);
      } else {
        const data = await proxyChat(allMessages, { temperature: 0.3, max_tokens: 500 });
        return parseActionFromResponse(data.choices?.[0]?.message?.content || '');
      }
    }
  } catch (err) {
    console.error('Chat error:', err);
    return { text: 'Something went wrong. Please try again.' };
  }
}

async function simulateStream(text: string, onChunk: (text: string) => void): Promise<void> {
  const words = text.split(' ');
  let displayed = '';
  for (let i = 0; i < words.length; i++) {
    displayed += (i === 0 ? '' : ' ') + words[i];
    onChunk(displayed);
    await new Promise(r => setTimeout(r, 18));
  }
}

function parseActionFromResponse(fullText: string): { text: string; action?: ChatAction } {
  let text = fullText;
  let actionJson = '';

  // Pattern 1: Standard ACTION_JSON: on its own line
  const lineMatch = fullText.match(/\n?ACTION_JSON:\s*(\{[\s\S]*)/);
  if (lineMatch) {
    text = fullText.slice(0, lineMatch.index).trim();
    actionJson = lineMatch[1];
  }

  // Pattern 2: ACTION_JSON inside backticks
  if (!actionJson) {
    const backtickMatch = fullText.match(/`+\s*ACTION_JSON:\s*(\{[\s\S]*?\})\s*`+/);
    if (backtickMatch) {
      text = fullText.replace(backtickMatch[0], '').trim();
      actionJson = backtickMatch[1];
    }
  }

  // Pattern 3: ACTION_JSON inside code block
  if (!actionJson) {
    const codeBlockMatch = fullText.match(/```(?:json)?\s*\n?\s*ACTION_JSON:\s*(\{[\s\S]*?\})\s*\n?\s*```/);
    if (codeBlockMatch) {
      text = fullText.replace(codeBlockMatch[0], '').trim();
      actionJson = codeBlockMatch[1];
    }
  }

  // Pattern 4: ACTION_JSON without colon
  if (!actionJson) {
    const noColonMatch = fullText.match(/\n?ACTION_JSON\s*:?\s*(\{[\s\S]*)/);
    if (noColonMatch) {
      text = fullText.slice(0, noColonMatch.index).trim();
      actionJson = noColonMatch[1];
    }
  }

  // Pattern 5: Raw JSON at end that looks like an action
  if (!actionJson) {
    const rawJsonMatch = fullText.match(/\n\s*(\{"type"\s*:\s*"(?:log_income|log_expense|create_invoice|navigate|view_report|check_stock)[\s\S]*)/);
    if (rawJsonMatch) {
      text = fullText.slice(0, rawJsonMatch.index).trim();
      actionJson = rawJsonMatch[1];
    }
  }

  // Clean text
  text = cleanText(text);

  // Parse action JSON
  let action: ChatAction | undefined;
  if (actionJson) {
    try {
      const jsonStr = extractFirstJson(actionJson.trim());
      if (jsonStr) {
        action = JSON.parse(jsonStr) as ChatAction;
        if (!action.type || !action.label) {
          action = undefined;
        }
      }
    } catch (e) {
      console.error('Failed to parse ACTION_JSON:', actionJson, e);
    }
  }

  return { text, action };
}

function extractFirstJson(str: string): string | null {
  str = str.replace(/^[`\s]+|[`\s]+$/g, '');

  let braceCount = 0;
  let startIdx = str.indexOf('{');
  if (startIdx === -1) return null;

  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') braceCount++;
    if (str[i] === '}') braceCount--;
    if (braceCount === 0) {
      return str.slice(startIdx, i + 1);
    }
  }

  // Truncation fix — try closing unclosed braces
  if (braceCount > 0) {
    let fixed = str.slice(startIdx);
    for (let i = 0; i < braceCount; i++) {
      fixed += '}';
    }
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      return null;
    }
  }

  return null;
}

function cleanText(text: string): string {
  return text
    .replace(/\\\[[\s\S]*?\\\]/g, '')
    .replace(/\\\([\s\S]*?\\\)/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`/g, '')
    .replace(/ACTION_JSON[\s\S]*/gi, '')
    .trim();
}