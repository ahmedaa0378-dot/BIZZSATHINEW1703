import { proxyChat } from './api-proxy';

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
    case 'hi': return `"Haan ji ${ownerName}! Boliye, kya karein — sale, kharcha, invoice, ya koi aur kaam?"`;
    case 'te': return `"Cheppandi ${ownerName} garu! Sale, kharchu, invoice — emi cheyamantaru?"`;
    case 'ta': return `"Sollunga ${ownerName}! Sale, chelavu, invoice — enna vennum?"`;
    case 'gu': return `"Bolo ${ownerName}! Sale, kharcho, invoice — shu karvu?"`;
    default: return `"Yes ${ownerName}! Tell me — sale, expense, invoice, or anything else?"`;
  }
}

function getConfirmWord(lang: string): string {
  switch (lang) {
    case 'hi': return 'haan/theek/sahi/ok/done/kar do';
    case 'te': return 'avunu/sare/ok/cheyandi';
    case 'ta': return 'aamam/sari/ok/pannunga';
    case 'gu': return 'ha/barobar/ok/karo';
    default: return 'yes/okay/correct/do it/confirm/sure';
  }
}

function getDonePhrase(lang: string, ownerName: string): string {
  switch (lang) {
    case 'hi': return `Theek hai ${ownerName} ji! Namaste!`;
    case 'te': return `Sare ${ownerName} garu! Namaskaram!`;
    case 'ta': return `Sari ${ownerName}! Vanakkam!`;
    case 'gu': return `Barobar ${ownerName}! Namaste!`;
    default: return `Done ${ownerName}! Bye!`;
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

  return `You are BizSaathi Voice Assistant for Indian MSMEs.
Talking to ${context.ownerName}, "${context.businessName}" (${context.businessType}).

LANGUAGE: ${langInstruction}
Use Rs for currency. Indian number format.

LIVE DATA:
- Today income: Rs ${context.todayIncome.toLocaleString('en-IN')}
- Today expense: Rs ${context.todayExpense.toLocaleString('en-IN')}
- Cash in hand: Rs ${context.cashInHand.toLocaleString('en-IN')}
- Low stock: ${context.lowStockItems || 'None'}
- Expense categories: ${context.categories.join(', ')}
- Known contacts: ${context.contacts.join(', ')}
- Known products: ${context.products.join(', ')}

RESPOND ONLY WITH VALID JSON:
{
  "text": "short response (1-2 sentences max)",
  "action": {
    "type": "log_income|log_expense|create_invoice|add_contact|check_stock|query|done|none",
    "data": { "amount": 0, "category": "", "contact_name": "", "product_name": "", "description": "", "payment_method": "Cash", "quantity": 0, "rate": 0, "items": [] }
  },
  "waitForInput": true,
  "closeAfterAction": false
}

=== CRITICAL EXECUTION RULES ===

1. GREETING: ${greetingExample}
   action.type = "none", waitForInput = true

2. COLLECT INFO FAST — ask MAXIMUM 2 questions total:
   - Question 1: What type + amount? (e.g., "500 income" or "200 kharcha petrol")
   - Question 2: Confirm and execute. DO NOT ask for payment method separately — default to Cash.

3. EXECUTE IMMEDIATELY when you have amount + type:
   - If user says an amount with any income/sale/received context → EXECUTE log_income
   - If user says an amount with any expense/kharcha/paid/bought context → EXECUTE log_expense
   - Default category: "Product Sales" for income, "Miscellaneous" for expense
   - Default payment_method: "Cash" ALWAYS unless user explicitly says UPI/card/bank

4. WHEN USER CONFIRMS (says ${confirmWord}) → EXECUTE the action immediately:
   action.type = "log_income" or "log_expense" with ALL collected data
   waitForInput = false (if closeAfterAction is true) or true (to ask "anything else?")

5. NEVER ask the same question twice. If you already have the amount, DO NOT ask again.
   NEVER ask "please confirm the amount" if user already told you.
   NEVER ask for payment method — default to Cash.

6. WHEN USER SAYS "bas/nothing/no/bye/done": text = "${donePhrase}", action.type = "done", closeAfterAction = true

7. QUERIES: Answer from live data directly. action.type = "query".

=== EXAMPLES ===

User: "Ad sense income"
→ {"text": "Kitna aaya AdSense se?", "action": {"type": "none", "data": {}}, "waitForInput": true, "closeAfterAction": false}

User: "500"
→ {"text": "Rs 500 AdSense income log kar diya. Aur kuch?", "action": {"type": "log_income", "data": {"amount": 500, "category": "Service Income", "description": "AdSense income", "payment_method": "Cash"}}, "waitForInput": true, "closeAfterAction": false}

User: "sale 300"
→ {"text": "Rs 300 sale log ho gaya. Aur kuch?", "action": {"type": "log_income", "data": {"amount": 300, "category": "Product Sales", "description": "Sale", "payment_method": "Cash"}}, "waitForInput": true, "closeAfterAction": false}

User: "kharcha 200 petrol"
→ {"text": "Rs 200 petrol kharcha log ho gaya. Aur kuch?", "action": {"type": "log_expense", "data": {"amount": 200, "category": "Transport", "description": "Petrol", "payment_method": "Cash"}}, "waitForInput": true, "closeAfterAction": false}

User: "5000 maal liya Sharma se UPI se"
→ {"text": "Rs 5,000 stock purchase from Sharma, UPI se log ho gaya. Aur kuch?", "action": {"type": "log_expense", "data": {"amount": 5000, "category": "Stock Purchase", "description": "Maal from Sharma", "payment_method": "UPI", "contact_name": "Sharma"}}, "waitForInput": true, "closeAfterAction": false}

User: "profit kitna hai?"
→ {"text": "Aaj ka profit Rs ${(context.todayIncome - context.todayExpense).toLocaleString('en-IN')} hai.", "action": {"type": "query", "data": {}}, "waitForInput": true, "closeAfterAction": false}

User: "bas"
→ {"text": "${donePhrase}", "action": {"type": "done", "data": {}}, "waitForInput": false, "closeAfterAction": true}

IMPORTANT:
- MAXIMUM 2 questions before executing. After that, execute with defaults.
- Keep responses under 15 words.
- NEVER use markdown, latex, or bullet points.
- RESPOND WITH VALID JSON ONLY.`;
}

export async function getVoiceResponse(
  conversationHistory: VoiceConversationMessage[]
): Promise<VoiceAIResponse> {
  try {
    // Keep system prompt + last 10 messages to prevent token overflow
    const systemMsg = conversationHistory[0];
    const recentMsgs = conversationHistory.slice(-10);
    const truncatedHistory = systemMsg?.role === 'system'
      ? [systemMsg, ...recentMsgs.filter(m => m.role !== 'system')]
      : recentMsgs;

    const data = await proxyChat(truncatedHistory, {
      temperature: 0.2,
      max_tokens: 300,
    });

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