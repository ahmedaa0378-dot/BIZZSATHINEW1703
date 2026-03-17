import { useState, useEffect, useRef } from 'react';
import {
  X, Send, Sparkles, Loader2, Bot, User,
  ArrowUpCircle, ArrowDownCircle, FileText, BarChart3,
  ExternalLink, Package, UserPlus, DollarSign, TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { sendChatMessage, type ChatMessage, type ChatAction } from '../../lib/openai';
import { useTransactionStore } from '../../stores/transactionStore';
import { useProductStore } from '../../stores/productStore';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useContactStore } from '../../stores/contactStore';
import { useBusinessStore } from '../../stores/appStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ACTION_ICONS: Record<string, typeof ArrowUpCircle> = {
  log_income: ArrowUpCircle,
  log_expense: ArrowDownCircle,
  create_invoice: FileText,
  navigate: ExternalLink,
  view_report: BarChart3,
  check_stock: Package,
  send_reminder: Send,
};

const ACTION_COLORS: Record<string, string> = {
  log_income: 'bg-emerald-500 text-white',
  log_expense: 'bg-red-500 text-white',
  create_invoice: 'bg-blue-500 text-white',
  navigate: 'bg-[#c8ee44] text-black',
  view_report: 'bg-violet-500 text-white',
  check_stock: 'bg-amber-500 text-white',
  send_reminder: 'bg-blue-500 text-white',
};

export default function ChatOverlay({ open, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [actionExecuted, setActionExecuted] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { transactions, dashboardStats, cashInHand, addTransaction, fetchTransactions, fetchDashboardStats, fetchCashInHand, categories } = useTransactionStore();
  const { products } = useProductStore();
  const { invoices } = useInvoiceStore();
  const { contacts, addContact } = useContactStore();
  const { business } = useBusinessStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    if (open && messages.length === 0) {
      const greetings: Record<string, string> = {
        en: `Hello ${business?.ownerName || ''}! 👋 I'm BizzSathi AI. I can log sales & expenses, check your profit, create invoices, and more. What would you like to do?`,
        hi: `Namaste ${business?.ownerName || ''} ji! 🙏 Main BizzSathi AI hoon. Sale/expense log karna, profit check karna, invoice banana — batayein kya karna hai?`,
        te: `నమస్కారం ${business?.ownerName || ''}! 🙏 BizzSathi AI ని. Sale/expense log, profit check, invoice create — ఏమి చేయాలి?`,
        ta: `வணக்கம் ${business?.ownerName || ''}! 🙏 BizzSathi AI. Sale/expense log, profit check, invoice create — என்ன செய்யணும்?`,
        gu: `નમસ્તે ${business?.ownerName || ''}! 🙏 BizzSathi AI છું. Sale/expense log, profit check, invoice create — શું કરવું છે?`,
      };
      setMessages([{ role: 'assistant', content: greetings[language] || greetings.en }]);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamText]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const getBusinessContext = () => {
    const recentTx = transactions.slice(0, 5).map((t) =>
      `${t.type}: Rs ${t.amount} ${t.category_name} ${t.contact_name ? '(' + t.contact_name + ')' : ''} on ${t.transaction_date}`
    ).join('; ');

    const lowStock = products
      .filter((p) => p.current_stock <= p.low_stock_threshold)
      .map((p) => `${p.name}: ${p.current_stock} ${p.unit}`)
      .join(', ');

    const pendingInvs = invoices.filter((i) => ['sent', 'overdue', 'partial'].includes(i.status));
    const pendingAmount = pendingInvs.reduce((s, i) => s + Number(i.balance_due), 0);

    const topContacts = contacts.slice(0, 5).map((c) =>
      `${c.name} (${c.type}, balance: Rs ${c.outstanding_balance})`
    ).join(', ');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    const monthTx = transactions.filter((t) => t.transaction_date >= monthStart && t.transaction_date <= today);
    const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    return {
      businessName: business?.name || '',
      businessType: business?.type || '',
      ownerName: business?.ownerName || '',
      todayIncome: Number(dashboardStats?.total_income || 0),
      todayExpense: Number(dashboardStats?.total_expense || 0),
      monthIncome,
      monthExpense,
      cashInHand,
      recentTransactions: recentTx || 'No transactions yet',
      pendingInvoices: pendingInvs.length,
      pendingAmount,
      lowStockItems: lowStock || 'None',
      topContacts,
      totalProducts: products.length,
      language,
    };
  };

  const handleAction = async (action: ChatAction) => {
    if (!business) return;
    setActionExecuted(action.label);

    if (action.type === 'log_income' || action.type === 'log_expense') {
      const type = action.type === 'log_income' ? 'income' : 'expense';
      const d = action.data || {};

      // Match category
      const cat = categories.find((c) =>
        c.type === type && c.name.toLowerCase().includes((d.category || '').toLowerCase())
      );

      const tx = await addTransaction({
        business_id: business.id,
        type,
        amount: d.amount || 0,
        category_id: cat?.id || null,
        category_name: cat?.name || d.category || (type === 'income' ? 'Product Sales' : 'Miscellaneous'),
        payment_method_id: null,
        payment_method_name: d.payment_method || 'Cash',
        contact_id: null,
        contact_name: d.contact_name || null,
        description: d.description || null,
        receipt_url: null,
        payment_status: 'paid',
        tags: [],
        transaction_date: new Date().toISOString().split('T')[0],
      });

      if (tx) {
        fetchTransactions(business.id);
        const today = new Date().toISOString().split('T')[0];
        fetchDashboardStats(business.id, today, today);
        fetchCashInHand(business.id);

        const confirmMsgs: Record<string, string> = {
          en: `Done! Rs ${(d.amount || 0).toLocaleString('en-IN')} ${type} logged as ${cat?.name || d.category || 'General'} via ${d.payment_method || 'Cash'}. Anything else?`,
          hi: `Ho gaya! Rs ${(d.amount || 0).toLocaleString('en-IN')} ${type === 'income' ? 'income' : 'kharcha'} log ho gaya. ${cat?.name || d.category || 'General'}, ${d.payment_method || 'Cash'} se. Aur kuch?`,
          te: `అయింది! Rs ${(d.amount || 0).toLocaleString('en-IN')} ${type} log అయింది. ఇంకేమైనా?`,
          ta: `ஆனது! Rs ${(d.amount || 0).toLocaleString('en-IN')} ${type} log ஆனது. வேறு ஏதாவது?`,
          gu: `થઈ ગયું! Rs ${(d.amount || 0).toLocaleString('en-IN')} ${type} log થયું. બીજું કંઈ?`,
        };
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: confirmMsgs[language] || confirmMsgs.en,
        }]);
      }
    } else if (action.type === 'create_invoice') {
      onClose();
      navigate('/invoices/create');
    } else if (action.type === 'navigate') {
      onClose();
      navigate(action.data?.path || '/');
    } else if (action.type === 'view_report') {
      onClose();
      navigate('/reports');
    } else if (action.type === 'check_stock') {
      onClose();
      navigate('/stock');
    }

    setTimeout(() => setActionExecuted(null), 2000);
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setStreamText('');

    const context = getBusinessContext();

    const { text: responseText, action } = await sendChatMessage(
      newMessages,
      context,
      (partial) => setStreamText(partial)
    );

    setStreaming(false);
    setStreamText('');
    setMessages([...newMessages, { role: 'assistant', content: responseText, action }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action chips
  const getQuickChips = (): { label: string; icon: typeof DollarSign; text: string }[] => {
    const isHi = language === 'hi';
    const chips = [
      { label: isHi ? '💰 Sale Log' : '💰 Log Sale', icon: ArrowUpCircle, text: isHi ? 'Sale add karo' : 'Add a sale' },
      { label: isHi ? '📉 Kharcha' : '📉 Expense', icon: ArrowDownCircle, text: isHi ? 'Expense add karo' : 'Add an expense' },
      { label: isHi ? '📊 Aaj Ka Report' : "📊 Today's Report", icon: BarChart3, text: isHi ? 'Aaj ka summary batao' : "Show today's summary" },
      { label: isHi ? '📦 Stock Check' : '📦 Stock Check', icon: Package, text: isHi ? 'Stock mein kya kam hai?' : 'Which items are low on stock?' },
    ];

    // Add contextual chips
    const pendingInvs = invoices.filter((i) => ['sent', 'overdue', 'partial'].includes(i.status));
    if (pendingInvs.length > 0) {
      chips.push({ label: isHi ? '📄 Pending Bills' : '📄 Pending Invoices', icon: FileText, text: isHi ? 'Pending invoices batao' : 'Show pending invoices' });
    }

    return chips.slice(0, 4);
  };

  // Contextual prompts after conversation has some messages
  const getSuggestions = (): string[] => {
    const isHi = language === 'hi';
    const hour = new Date().getHours();
    const suggestions: string[] = [];

    if (hour < 12) {
      suggestions.push(isHi ? 'Kal ka summary batao' : "Yesterday's summary");
      suggestions.push(isHi ? 'Pending invoices kitne hain?' : 'How many pending invoices?');
    } else {
      suggestions.push(isHi ? 'Aaj ki sale kitni hui?' : "Today's total sales?");
      suggestions.push(isHi ? 'Profit margin kaisa hai?' : "What's the profit margin?");
    }

    suggestions.push(isHi ? 'Cash in hand kitna hai?' : 'Cash in hand?');

    const lowItems = products.filter((p) => p.current_stock <= p.low_stock_threshold);
    if (lowItems.length > 0) {
      suggestions.push(isHi ? 'Stock mein kya kam hai?' : 'Low stock items?');
    }

    return suggestions.slice(0, 3);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEndConfirm(true)} />

      <div className="relative w-full max-w-[430px] h-[85vh] flex flex-col
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c8ee44] to-[#a3c428] flex items-center justify-center">
              <Sparkles size={16} className="text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">BizzSathi AI</p>
              <p className="text-[10px] text-emerald-500 font-semibold">Online</p>
            </div>
          </div>
          <button onClick={() => setShowEndConfirm(true)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <MessageBubble message={msg} />

              {/* Action Button */}
              {msg.action && (
                <div className="flex gap-2 ml-10 mt-2">
                  <button
                    onClick={() => handleAction(msg.action!)}
                    disabled={actionExecuted === msg.action.label}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold',
                      'active:scale-[0.97] transition-all shadow-sm disabled:opacity-50',
                      actionExecuted === msg.action.label
                        ? 'bg-emerald-500 text-white'
                        : ACTION_COLORS[msg.action.type] || 'bg-[#c8ee44] text-black'
                    )}
                  >
                    {actionExecuted === msg.action.label ? (
                      <><Check size={14} /> Done!</>
                    ) : (
                      <>
                        {(() => { const Icon = ACTION_ICONS[msg.action!.type] || ExternalLink; return <Icon size={14} />; })()}
                        {msg.action.label}
                      </>
                    )}
                  </button>

                  {/* Cancel button for transaction actions */}
                  {(msg.action.type === 'log_income' || msg.action.type === 'log_expense') && actionExecuted !== msg.action.label && (
                    <button
                      onClick={() => {
                        const cancelMsg: Record<string, string> = {
                          en: 'Cancelled. What else can I help with?',
                          hi: 'Cancel ho gaya. Aur kya karna hai?',
                        };
                        setMessages((prev) => [...prev, { role: 'assistant', content: cancelMsg[language] || cancelMsg.en }]);
                      }}
                      className="px-4 py-2.5 rounded-2xl text-xs font-semibold
                        bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-zinc-400
                        active:scale-[0.97] transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Streaming */}
          {streaming && streamText && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#c8ee44]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[#8fb02e] dark:text-[#c8ee44]" />
              </div>
              <div className="glass-card px-4 py-3 max-w-[85%]">
                <p className="text-sm text-neutral-900 dark:text-white whitespace-pre-wrap">{streamText}</p>
              </div>
            </div>
          )}

          {streaming && !streamText && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#c8ee44]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[#8fb02e] dark:text-[#c8ee44]" />
              </div>
              <div className="glass-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Chips — shown after greeting */}
          {messages.length === 1 && !streaming && (
            <div className="space-y-3 pt-2">
              {/* Action chips */}
              <div className="flex flex-wrap gap-2">
                {getQuickChips().map((chip, i) => (
                  <button key={i} onClick={() => handleSend(chip.text)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold
                      bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-zinc-300
                      hover:bg-neutral-200 dark:hover:bg-white/8
                      active:scale-[0.97] transition-all border border-neutral-200 dark:border-white/10">
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Text suggestions */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 text-center">
                  Or ask
                </p>
                {getSuggestions().map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)}
                    className="w-full glass-card px-4 py-2.5 text-left text-sm
                      text-neutral-700 dark:text-zinc-300 hover:border-[#c8ee44]/30
                      transition-colors active:scale-[0.98]">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* After a few messages, show follow-up suggestions */}
          {messages.length > 2 && messages.length % 3 === 0 && !streaming && (
            <div className="flex flex-wrap gap-2 pt-1">
              {getQuickChips().slice(0, 3).map((chip, i) => (
                <button key={i} onClick={() => handleSend(chip.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
                    bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-zinc-400
                    hover:bg-neutral-100 dark:hover:bg-white/8
                    active:scale-[0.97] transition-all border border-neutral-100 dark:border-white/5">
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-neutral-200/60 dark:border-white/5 bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <div className="flex-1 glass-card flex items-center px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'hi' ? 'Sale 500, kharcha 200, profit batao...' :
                  language === 'te' ? 'Sale 500, expense 200, profit cheppandi...' :
                  language === 'ta' ? 'Sale 500, expense 200, profit sollunga...' :
                  language === 'gu' ? 'Sale 500, kharcho 200, profit batavo...' :
                  'Sale 500, expense 200, check profit...'
                }
                disabled={streaming}
                className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white
                  placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || streaming}
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
                input.trim() && !streaming
                  ? 'bg-gradient-to-br from-[#c8ee44] to-[#a3c428] text-black shadow-[0_4px_20px_rgba(200,238,68,0.3)]'
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-zinc-600'
              )}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {showEndConfirm && (
          <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-t-3xl">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 mx-6 w-full max-w-[300px] shadow-xl">
              <p className="text-sm font-bold text-neutral-900 dark:text-white text-center mb-1">End Chat?</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center mb-4">This will clear the conversation.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-zinc-400 text-sm font-semibold active:scale-[0.97] transition-all">
                  Cancel
                </button>
                <button onClick={() => { setShowEndConfirm(false); setMessages([]); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold active:scale-[0.97] transition-all">
                  End Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2.5 items-start', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-blue-500/10' : 'bg-[#c8ee44]/20'
      )}>
        {isUser ? <User size={14} className="text-blue-500" /> : <Bot size={14} className="text-[#8fb02e] dark:text-[#c8ee44]" />}
      </div>
      <div className={cn(
        'max-w-[85%] px-4 py-3 rounded-2xl',
        isUser ? 'bg-[#c8ee44] text-black rounded-tr-md' : 'glass-card rounded-tl-md'
      )}>
        <p className={cn('text-sm whitespace-pre-wrap leading-relaxed',
          isUser ? 'text-black' : 'text-neutral-900 dark:text-white')}>
          {message.content}
        </p>
      </div>
    </div>
  );
}