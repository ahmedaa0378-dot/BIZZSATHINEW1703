const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const API_URL = 'https://api.openai.com/v1/chat/completions';

export interface VoiceConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface VoiceAIResponse {
  text: string;
  action?: {
    type: 'log_income' | 'log_expense' | 'create_invoice' | 'add_contact' | 'check_stock' | 'query' | 'done' | 'none';
    data?: {
      amount?: number;
      category?: string;
      contact_name?: string;
      product_name?: string;
      description?: string;
      payment_method?: string;
      quantity?: number;
      rate?: number;
      items?: { name: string; quantity: number; rate: number }[];
    };
  };
  waitForInput: boolean;
  closeAfterAction: boolean;
}

function getLanguageInstruction(lang: string): string {
  switch (lang) {
    case 'hi': return 'Respond in Hindi/Hinglish only. Use "aap", "ji" respectfully.';
    case 'te': return 'Respond in Telugu only. Use respectful tone with "meeru", "garu".';
    case 'ta': return 'Respond in Tamil only. Use respectful tone with "neenga", "inga".';
    case 'gu': return 'Respond in Gujarati only. Use respectful tone.';
    default: return 'Respond in English only.';
  }
}

function getGreetingExample(lang: string, ownerName: string): string {
  switch (lang) {
    case 'hi': return `"Good Morning ${ownerName} ji! Main aapka business assistant hoon. Aap mujhse income add karna, expense add karna, contact banana, invoice banwana, ya business query pooch sakte hain. Batayein, kya karna hai?"`;
    case 'te': return `"Good Morning ${ownerName} garu! Nenu mee business assistant ni. Income add cheyyadam, expense add cheyyadam, contact create cheyyadam, invoice generate cheyyadam — emi cheyamantaru?"`;
    case 'ta': return `"Good Morning ${ownerName}! Naan unga business assistant. Income add panna, expense add panna, contact create panna, invoice generate panna — enna seyyanum?"`;
    case 'gu': return `"Good Morning ${ownerName}! Hu tamaro business assistant chu. Income add karvu, expense add karvu, contact banawvu, invoice generate karvu — shu karvu che?"`;
    default: return `"Good Morning ${ownerName}! I'm your business assistant. You can ask me to add income, add expense, create contact, generate invoice, or check your business data. How can I help?"`;
  }
}

function getConfirmWord(lang: string): string {
  switch (lang) {
    case 'hi': return 'haan/theek/sahi';
    case 'te': return 'avunu/sare';
    case 'ta': return 'aamam/sari';
    case 'gu': return 'ha/barobar';
    default: return 'yes/okay/correct';
  }
}

function getDonePhrase(lang: string, ownerName: string): string {
  switch (lang) {
    case 'hi': return `Theek hai ${ownerName} ji! Jab zarurat ho bulana. Namaste!`;
    case 'te': return `Sare ${ownerName} garu! Avasaram ayyappudu pilavandi. Namaskaram!`;
    case 'ta': return `Sari ${ownerName}! Thevai enbodhu kuppidungal. Vanakkam!`;
    case 'gu': return `Barobar ${ownerName}! Jarur pade tyare bolavo. Namaste!`;
    default: return `Alright ${ownerName}! Call me whenever you need. Bye!`;
  }
}

export function buildVoiceSystemPrompt(context: {
  ownerName: string;
  businessName: string;
  businessType: string;
  language: string;
  categories: string[];
  contacts: string[];
  products: string[];
  todayIncome: number;
  todayExpense: number;
  cashInHand: number;
  lowStockItems: string;
}): string {
  const lang = context.language;
  const langInstruction = getLanguageInstruction(lang);
  const greetingExample = getGreetingExample(lang, context.ownerName);
  const confirmWord = getConfirmWord(lang);
  const donePhrase = getDonePhrase(lang, context.ownerName);

  return `You are BizzSathi Voice Assistant — a conversational business assistant for Indian MSMEs.
You are talking to ${context.ownerName} who runs "${context.businessName}" (${context.businessType}).

LANGUAGE: ${langInstruction}
Use Rs for currency. Indian number format (12,34,567).

LIVE DATA:
- Today income: Rs ${context.todayIncome.toLocaleString('en-IN')}
- Today expense: Rs ${context.todayExpense.toLocaleString('en-IN')}
- Cash in hand: Rs ${context.cashInHand.toLocaleString('en-IN')}
- Low stock: ${context.lowStockItems || 'None'}
- Expense categories: ${context.categories.join(', ')}
- Known contacts: ${context.contacts.join(', ')}
- Known products: ${context.products.join(', ')}

YOU ARE A STEP-BY-STEP CONVERSATIONAL ASSISTANT. Guide the user through tasks by asking ONE question at a time.

RESPONSE FORMAT — respond ONLY with valid JSON:
{
  "text": "your spoken response (short, 1-2 sentences, plain text, NO markdown/latex)",
  "action": {
    "type": "log_income|log_expense|create_invoice|add_contact|check_stock|query|done|none",
    "data": { "amount": 0, "category": "", "contact_name": "", "product_name": "", "description": "", "payment_method": "Cash", "quantity": 0, "rate": 0, "items": [] }
  },
  "waitForInput": true,
  "closeAfterAction": false
}

CONVERSATION RULES:

1. GREETING (first message): ${greetingExample}
   action.type = "none", waitForInput = true

2. ADD INCOME flow: Ask step by step — what product/type → amount → payment method → confirm
   When user says ${confirmWord} → action.type = "log_income" with all data

3. ADD EXPENSE flow: Ask step by step — category → amount → contact (optional) → confirm
   When user says ${confirmWord} → action.type = "log_expense" with all data

4. CREATE INVOICE flow: Ask customer name → items → confirm
   action.type = "create_invoice", closeAfterAction = true

5. QUERIES: Answer from live data directly. After answering, ask if anything else needed.

6. WHEN USER SAYS "bas/nothing/no/nahi/that's all/bye":
   text = "${donePhrase}"
   action.type = "done", waitForInput = false, closeAfterAction = true

7. IF UNCLEAR: Ask to clarify. action.type = "none", waitForInput = true

IMPORTANT:
- Ask ONLY ONE question per response
- Keep responses under 30 words
- NEVER use markdown, latex, bullet points
- When user confirms, EXECUTE the action
- Payment method defaults to "Cash"
- Match category to nearest: ${context.categories.join(', ')}
- RESPOND WITH VALID JSON ONLY`;
}

export async function getVoiceResponse(
  conversationHistory: VoiceConversationMessage[]
): Promise<VoiceAIResponse> {
  if (!OPENAI_API_KEY) {
    return { text: 'OpenAI API key not configured.', waitForInput: false, closeAfterAction: false };
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationHistory,
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleaned) as VoiceAIResponse;
    } catch {
      return { text: cleaned, waitForInput: true, closeAfterAction: false };
    }
  } catch (err) {
    console.error('Voice AI error:', err);
    return { text: 'Something went wrong. Please try again.', waitForInput: false, closeAfterAction: false };
  }
}