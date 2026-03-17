import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Insight {
  id: string;
  business_id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'opportunity';
  is_read: boolean;
  is_dismissed: boolean;
  data: any;
  created_at: string;
}

interface InsightsStore {
  insights: Insight[];
  loading: boolean;
  fetchInsights: (businessId: string) => Promise<void>;
  generateInsights: (businessId: string) => Promise<void>;
  dismissInsight: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useInsightsStore = create<InsightsStore>((set, get) => ({
  insights: [],
  loading: false,

  fetchInsights: async (businessId) => {
    const { data } = await supabase
      .from('insights')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) set({ insights: data as Insight[] });
  },

  generateInsights: async (businessId) => {
    set({ loading: true });
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!OPENAI_API_KEY) { set({ loading: false }); return; }

    // Gather business data
    const [txRes, prodRes, invRes] = await Promise.all([
      supabase.from('transactions').select('type, amount, category_name, transaction_date').eq('business_id', businessId).order('transaction_date', { ascending: false }).limit(50),
      supabase.from('products').select('name, current_stock, low_stock_threshold, sell_price').eq('business_id', businessId).eq('is_active', true),
      supabase.from('invoices').select('status, grand_total, balance_due, customer_name, invoice_date').eq('business_id', businessId).limit(20),
    ]);

    const txSummary = (txRes.data || []).map((t: any) => `${t.type}: ₹${t.amount} (${t.category_name}, ${t.transaction_date})`).join('\n');
    const stockSummary = (prodRes.data || []).map((p: any) => `${p.name}: ${p.current_stock} units (threshold: ${p.low_stock_threshold}, price: ₹${p.sell_price})`).join('\n');
    const invSummary = (invRes.data || []).map((i: any) => `${i.customer_name}: ₹${i.grand_total} (${i.status}, due: ₹${i.balance_due})`).join('\n');

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'system',
            content: `You are a business analyst for an Indian MSME. Analyze this data and generate 3-5 actionable insights.

Return ONLY a JSON array of objects with: type (spending_alert|revenue_trend|margin_watch|customer_alert|stock_prediction|invoice_alert|cash_flow|festival_opportunity|payment_pattern|best_selling), title (short, can be Hinglish), description (1-2 sentences), severity (info|warning|critical|opportunity).

Example: [{"type":"stock_prediction","title":"Toor Dal 3 din mein khatam","description":"Current stock will last only 3 days at current sales rate. Reorder now.","severity":"warning"}]

NO markdown, NO code blocks. ONLY valid JSON array.`
          }, {
            role: 'user',
            content: `Recent Transactions:\n${txSummary || 'No transactions'}\n\nStock:\n${stockSummary || 'No products'}\n\nInvoices:\n${invSummary || 'No invoices'}`
          }],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '[]';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as any[];

      // Save to DB
      const insightsToSave = parsed.map((p: any) => ({
        business_id: businessId,
        type: p.type || 'info',
        title: p.title || '',
        description: p.description || '',
        severity: p.severity || 'info',
      }));

      if (insightsToSave.length > 0) {
        await supabase.from('insights').insert(insightsToSave);
        // Refresh
        await get().fetchInsights(businessId);
      }
    } catch (err) {
      console.error('Generate insights error:', err);
    }
    set({ loading: false });
  },

  dismissInsight: async (id) => {
    await supabase.from('insights').update({ is_dismissed: true }).eq('id', id);
    set({ insights: get().insights.filter((i) => i.id !== id) });
  },

  markRead: async (id) => {
    await supabase.from('insights').update({ is_read: true }).eq('id', id);
    set({ insights: get().insights.map((i) => i.id === id ? { ...i, is_read: true } : i) });
  },
}));
