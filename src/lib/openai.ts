// Re-export voice functions
export { buildVoiceSystemPrompt, getVoiceResponse } from './openai-voice';
export type { VoiceConversationMessage, VoiceAIResponse } from './openai-voice';

import { BIZZSATHI_KNOWLEDGE_BASE } from './knowledge-base';

// ========== CHATBOT ==========

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const API_URL = 'https://api.openai.com/v1/chat/completions';

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
  if (!OPENAI_API_KEY) {
    return { text: 'OpenAI API key not configured.' };
  }

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

YOU HAVE TWO MODES:

MODE 1 — BUSINESS ACTIONS (when user wants to DO something):
- "sale 300" / "income 500" → include ACTION_JSON for log_income
- "kharcha 200" / "expense 200" → include ACTION_JSON for log_expense
- "invoice banao" → include ACTION_JSON for create_invoice
- "report dikhao" → include ACTION_JSON for navigate to /reports
- "stock check" → include ACTION_JSON for navigate to /stock

ACTION_JSON format (put on LAST line):
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sugar sale","payment_method":"Cash"},"label":"Log Rs 300 Income"}

MODE 2 — HELP & KNOWLEDGE (when user asks "how to" or about features):
- Answer using the KNOWLEDGE BASE above
- Give short, step-by-step instructions (2-4 steps max)
- Include navigation path: "Go to More → Business Profile"
- If relevant, offer to do it for them: "Main aapke liye kar doon?"
- For subscription questions, explain tiers clearly

EXAMPLES:

User: "invoice kaise banate hain?"
Response: "Invoice banane ke liye: 1) Home page pe 'Invoice' button dabayein, 2) Customer select karein, 3) Items add karein with quantity aur rate, 4) Save karein. Chahein toh main abhi invoice form khol doon?"
ACTION_JSON:{"type":"navigate","data":{"path":"/invoices/create"},"label":"Open Invoice Form"}

User: "language kaise change karein?"
Response: "Top header mein EN button hai, woh dabayein aur apni language select karein. Ya phir More → Preferences mein bhi change kar sakte hain."

User: "Pro plan mein kya milta hai?"
Response: "Pro plan mein: unlimited transactions, invoices, contacts, products. Saare 8 reports, unlimited voice aur chat, AI insights, WhatsApp notifications, online payments, 2 team members. Free mein sirf 50 transactions/month milte hain."

User: "sale 300"
Response: "Rs 300 sale log karoon? Cash mein?"
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sale","payment_method":"Cash"},"label":"Log Rs 300 Income"}

User: "profit margin?"
Response: "Is mahine ka profit Rs ${monthProfit.toLocaleString('en-IN')} hai. Margin ${monthMargin}% hai."

RULES:
1. Keep responses under 3 sentences for actions, up to 5 for help/knowledge
2. NEVER use LaTeX, markdown, bullet points, or code blocks
3. NEVER show formulas — just calculate and give the answer
4. For "how to" questions, give numbered steps in plain text (1, 2, 3 — not bullets)
5. Include navigation paths like "More → Settings → Business Profile"
6. When a user asks about a feature, offer to navigate them there with ACTION_JSON
7. Indian number format (12,34,567), Rs symbol
8. Default payment to "Cash" unless specified
9. ACTION_JSON must be valid JSON on the last line, prefixed with "ACTION_JSON:"
10. If user asks something not in the knowledge base, say you don't know and suggest contacting support`;

  try {
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...apiMessages.slice(-6)],
        temperature: 0.3,
        max_tokens: 400,
        stream: !!onChunk,
      }),
    });

    if (onChunk) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            const json = line.replace('data: ', '').trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              fullText += delta;
              onChunk(fullText.split('ACTION_JSON:')[0].trim());
            } catch {}
          }
        }
      }
      return parseActionFromResponse(fullText);
    } else {
      const data = await res.json();
      return parseActionFromResponse(data.choices?.[0]?.message?.content || '');
    }
  } catch (err) {
    return { text: 'Something went wrong. Please try again.' };
  }
}

function parseActionFromResponse(fullText: string): { text: string; action?: ChatAction } {
  const parts = fullText.split('ACTION_JSON:');
  let text = parts[0].trim();

  // Clean any markdown/latex
  text = text
    .replace(/\\\[[\s\S]*?\\\]/g, '')
    .replace(/\\\([\s\S]*?\\\)/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`/g, '')
    .trim();

  let action: ChatAction | undefined;
  if (parts[1]) {
    try {
      let jsonStr = parts[1].trim();
      let braceCount = 0;
      let endIdx = 0;
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        if (jsonStr[i] === '}') braceCount--;
        if (braceCount === 0 && i > 0) { endIdx = i + 1; break; }
      }
      if (endIdx > 0) jsonStr = jsonStr.slice(0, endIdx);
      action = JSON.parse(jsonStr) as ChatAction;
    } catch (e) {
      console.error('Failed to parse ACTION_JSON:', parts[1]);
    }
  }

  return { text, action };
}