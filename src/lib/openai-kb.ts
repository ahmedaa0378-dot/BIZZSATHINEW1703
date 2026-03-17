// Re-export voice functions
export { buildVoiceSystemPrompt, getVoiceResponse } from './openai-voice';
export type { VoiceConversationMessage, VoiceAIResponse } from './openai-voice';

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

ACTION DETECTION — this is critical:

When user mentions ANY of these, you MUST include ACTION_JSON at the end:
- "sale 300" / "300 ki biki" / "sold sugar" / "income 500" → log_income
- "kharcha 200" / "expense 200" / "rent 5000" / "petrol 500" → log_expense
- "invoice banao" / "bill create" / "invoice for Ramesh" → create_invoice
- "report dikhao" / "show report" → view_report
- "stock check" / "stock dikhao" → check_stock

FORMAT for actions — put this on the LAST line of your response:
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sugar sale","payment_method":"Cash"},"label":"Log Rs 300 Income"}

EXAMPLES:

User: "sale 300"
Response: "Rs 300 ki sale log karoon? Cash mein?
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sale","payment_method":"Cash"},"label":"Log Rs 300 Income"}"

User: "500 kharcha delivery"
Response: "Rs 500 delivery kharcha log kar deta hoon.
ACTION_JSON:{"type":"log_expense","data":{"amount":500,"category":"Transport/Delivery","description":"Delivery charge","payment_method":"Cash"},"label":"Log Rs 500 Expense"}"

User: "sugar sale 300 Ramesh ko"
Response: "Ramesh ko sugar Rs 300 sale, cash mein. Log karoon?
ACTION_JSON:{"type":"log_income","data":{"amount":300,"category":"Product Sales","description":"Sugar sale","contact_name":"Ramesh","payment_method":"Cash"},"label":"Log Rs 300 Income"}"

User: "invoice banao Ramesh ke liye"
Response: "Ramesh ke liye invoice open karta hoon.
ACTION_JSON:{"type":"create_invoice","data":{"contact_name":"Ramesh"},"label":"Create Invoice for Ramesh"}"

User: "profit margin?"
Response: "Is mahine ka profit Rs ${monthProfit.toLocaleString('en-IN')} hai. Margin ${monthMargin}% hai. Aaj ka profit Rs ${todayProfit.toLocaleString('en-IN')}."
(NO action needed — just answer)

User: "aaj ka summary"
Response: "Aaj income Rs ${businessContext.todayIncome.toLocaleString('en-IN')}, kharcha Rs ${businessContext.todayExpense.toLocaleString('en-IN')}, profit Rs ${todayProfit.toLocaleString('en-IN')}. Cash in hand Rs ${businessContext.cashInHand.toLocaleString('en-IN')}."
(NO action needed — just answer)

RULES:
1. Keep responses under 3 sentences
2. NEVER use LaTeX, markdown, bullet points, or code blocks
3. NEVER show formulas — just CALCULATE and give the answer
4. When amount is mentioned with sale/income context, ALWAYS include ACTION_JSON
5. When amount is mentioned with expense context, ALWAYS include ACTION_JSON
6. For queries (profit, balance, stock), just answer with real numbers
7. Indian number format (12,34,567)
8. Default payment to "Cash" unless specified
9. ACTION_JSON must be valid JSON on the last line, prefixed exactly with "ACTION_JSON:"`;

  try {
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...apiMessages.slice(-6)],
        temperature: 0.3,
        max_tokens: 300,
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
              // Don't show ACTION_JSON to user during streaming
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
  // Split on ACTION_JSON:
  const parts = fullText.split('ACTION_JSON:');
  let text = parts[0].trim();

  // Clean any markdown/latex that slipped through
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
      // Clean the JSON string — sometimes AI adds extra text after
      let jsonStr = parts[1].trim();
      // Find the end of the JSON object
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