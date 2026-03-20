import { useState } from 'react';
import {
  ArrowLeft, ChevronDown, MessageCircle, Mail, Phone,
  ExternalLink, FileText, Sparkles, Shield, HelpCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

const FAQS = [
  {
    q: 'How do I add a sale or expense?',
    a: 'Tap the "Income" or "Expense" button on the Home page. Fill in the amount, category, and payment method. You can also use the AI chatbot — just type "sale 500" or "kharcha 200 rent".',
  },
  {
    q: 'How do I create an invoice?',
    a: 'Tap "Invoice" on the Home page → select customer → add items with quantity and rate → review and save. You can enable GST and the app will auto-calculate CGST/SGST/IGST.',
  },
  {
    q: 'How do I download an invoice as PDF?',
    a: 'Go to Transactions → Invoices → find your invoice → tap "PDF" button. The PDF will download to your phone. You can also tap "Share" to send it via WhatsApp.',
  },
  {
    q: 'How do I manage my stock/inventory?',
    a: 'Go to the Stock tab (3rd tab at bottom). Tap "+" to add a product with name, price, and stock quantity. Tap any product to adjust stock (stock in/out/set).',
  },
  {
    q: 'How do I change the language?',
    a: 'Tap the language button (EN/HI etc.) in the top header bar. Available languages: English, Hindi, Telugu, Tamil, Gujarati.',
  },
  {
    q: 'How does the AI chatbot work?',
    a: 'Tap the green chat bubble (bottom right). You can ask questions like "aaj ka profit?", log transactions by typing "sale 300", or ask "how to create invoice?" for step-by-step help.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Your data is stored securely on servers in India (Mumbai region) with encryption. Each user can only see their own business data. We never share or sell your data.',
  },
  {
    q: 'What are the free plan limits?',
    a: 'Free plan: 50 transactions/month, 10 invoices, 25 contacts, 20 products, 10 voice commands/day, 20 chat messages/day. Upgrade to Pro for unlimited access.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Go to More → Subscription → select Pro or Business plan → complete payment. New users get a 7-day free Pro trial.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. Go to More → Preferences → tap "Export All Transactions". It downloads a CSV file you can open in Excel or Google Sheets.',
  },
  {
    q: 'How do I add team members?',
    a: 'Go to More → Team Members → tap "Invite". You can add team members with roles: Manager (view/create), Staff (add transactions), or Accountant (view/export only).',
  },
  {
    q: 'How do I find distributors near me?',
    a: 'Go to More → Find Distributors. Enable location to see distance. You can also search on Google Maps directly from the app, then add distributors to BizzSathi.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-[calc(56px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">Help & Support</h1>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-5 animate-fade-in">

        {/* Quick Contact */}
        <div className="premium-card p-5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <HelpCircle size={18} className="text-accent-dark dark:text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Need help?</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500">We're here for you</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a href="https://wa.me/919999999999?text=Hi%20BizzSathi%20team%2C%20I%20need%20help%20with..."
                target="_blank" rel="noopener"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 active:scale-[0.97] transition-all">
                <MessageCircle size={16} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">WhatsApp</p>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Quick reply</p>
                </div>
              </a>

              <a href="mailto:support@bizzsathi.com?subject=Help%20Request"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/10 active:scale-[0.97] transition-all">
                <Mail size={16} className="text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">Email</p>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-500">support@bizzsathi.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* AI Chatbot tip */}
        <div className="accent-card p-4 flex items-center gap-3">
          <Sparkles size={18} className="text-accent-dark dark:text-accent flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Try asking the AI Chatbot</p>
            <p className="text-[10px] text-neutral-500 dark:text-zinc-500">
              Tap the green chat bubble and ask "how to create invoice?" or any question about the app.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">
            FREQUENTLY ASKED QUESTIONS
          </p>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left active:bg-neutral-50 dark:active:bg-white/3 transition-colors"
                >
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white pr-4">{faq.q}</p>
                  <ChevronDown
                    size={16}
                    className={cn(
                      'text-neutral-400 dark:text-zinc-600 flex-shrink-0 transition-transform duration-200',
                      openFaq === i && 'rotate-180'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-600 mb-3">
            QUICK LINKS
          </p>
          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            <button onClick={() => navigate('/legal')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-white/3 transition-colors">
              <FileText size={16} className="text-neutral-400 dark:text-zinc-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Terms of Service</span>
              <ChevronDown size={14} className="text-neutral-300 dark:text-zinc-700 ml-auto -rotate-90" />
            </button>
            <button onClick={() => navigate('/legal')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-white/3 transition-colors">
              <Shield size={16} className="text-neutral-400 dark:text-zinc-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Privacy Policy</span>
              <ChevronDown size={14} className="text-neutral-300 dark:text-zinc-700 ml-auto -rotate-90" />
            </button>
            <a href="https://bizzsathi.com" target="_blank" rel="noopener"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-white/3 transition-colors">
              <ExternalLink size={16} className="text-neutral-400 dark:text-zinc-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Visit Website</span>
              <ChevronDown size={14} className="text-neutral-300 dark:text-zinc-700 ml-auto -rotate-90" />
            </a>
          </div>
        </div>

        {/* App Info */}
        <div className="glass-card p-5 text-center">
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            Bizz<span className="text-[#8fb02e] dark:text-[#c8ee44]">Sathi</span>
          </p>
          <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-1">Your AI Business Partner</p>
          <p className="text-[10px] text-neutral-400 dark:text-zinc-600 mt-2">Version 1.0.0</p>
          <p className="text-[10px] text-neutral-400 dark:text-zinc-600">Made with ❤️ in India</p>
        </div>
      </div>
    </PageWrapper>
  );
}