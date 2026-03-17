import { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, X, Loader2, Check, Volume2, AlertCircle,
} from 'lucide-react';
import { cn, formatINR } from '../../lib/utils';
import { buildVoiceSystemPrompt, getVoiceResponse, type VoiceConversationMessage, type VoiceAIResponse } from '../../lib/openai';
import { useTransactionStore } from '../../stores/transactionStore';
import { useProductStore } from '../../stores/productStore';
import { useContactStore } from '../../stores/contactStore';
import { useBusinessStore } from '../../stores/appStore';
import { useLanguageStore } from '../../stores/languageStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ConversationBubble {
  role: 'user' | 'assistant';
  text: string;
}

type ListenState = 'idle' | 'listening' | 'processing' | 'speaking' | 'waiting' | 'success' | 'error';

const LANG_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
};

export default function VoiceOverlay({ open, onClose }: Props) {
  const [listenState, setListenState] = useState<ListenState>('idle');
  const [bubbles, setBubbles] = useState<ConversationBubble[]>([]);
  const [conversationHistory, setConversationHistory] = useState<VoiceConversationMessage[]>([]);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  const { categories, paymentMethods, addTransaction, dashboardStats, cashInHand, transactions, fetchTransactions, fetchDashboardStats, fetchCashInHand } = useTransactionStore();
  const { products } = useProductStore();
  const { contacts } = useContactStore();
  const { business } = useBusinessStore();
  const { language } = useLanguageStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles, interimText]);

  useEffect(() => {
    if (open) {
      isMountedRef.current = true;
      setBubbles([]);
      setConversationHistory([]);
      setError('');
      setListenState('idle');
      setTimeout(() => startConversation(), 300);
    } else {
      isMountedRef.current = false;
      stopListening();
      window.speechSynthesis?.cancel();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  const buildSystemMessage = (): VoiceConversationMessage => {
    const lowStock = products
      .filter((p) => p.current_stock <= p.low_stock_threshold)
      .map((p) => `${p.name}: ${p.current_stock} ${p.unit}`)
      .join(', ');

    const prompt = buildVoiceSystemPrompt({
      ownerName: business?.ownerName || 'there',
      businessName: business?.name || '',
      businessType: business?.type || '',
      language,
      categories: categories.map((c) => c.name),
      contacts: contacts.slice(0, 15).map((c) => c.name),
      products: products.slice(0, 15).map((p) => p.name),
      todayIncome: Number(dashboardStats?.total_income || 0),
      todayExpense: Number(dashboardStats?.total_expense || 0),
      cashInHand,
      lowStockItems: lowStock || 'None',
    });

    return { role: 'system', content: prompt };
  };

  const startConversation = async () => {
    if (!isMountedRef.current) return;
    setListenState('processing');

    const systemMsg = buildSystemMessage();
    const userGreeting: VoiceConversationMessage = {
      role: 'user',
      content: 'Start the conversation with a greeting.',
    };

    const history = [systemMsg, userGreeting];
    const response = await getVoiceResponse(history);
    if (!isMountedRef.current) return;

    const newHistory = [systemMsg, { role: 'assistant' as const, content: response.text }];
    setConversationHistory(newHistory);
    setBubbles([{ role: 'assistant', text: response.text }]);

    speakAndThenListen(response.text, response.waitForInput);
  };

  const processUserInput = async (userText: string) => {
    if (!isMountedRef.current || !userText.trim()) return;

    setBubbles((prev) => [...prev, { role: 'user', text: userText }]);

    const userMsg: VoiceConversationMessage = { role: 'user', content: userText };
    const newHistory = [...conversationHistory, userMsg];
    setConversationHistory(newHistory);

    setListenState('processing');

    const response = await getVoiceResponse(newHistory);
    if (!isMountedRef.current) return;

    const assistantMsg: VoiceConversationMessage = { role: 'assistant', content: response.text };
    const updatedHistory = [...newHistory, assistantMsg];
    setConversationHistory(updatedHistory);

    setBubbles((prev) => [...prev, { role: 'assistant', text: response.text }]);

    if (response.action && response.action.type !== 'none' && response.action.type !== 'query') {
      await executeAction(response);
    }

    if (response.closeAfterAction) {
      speakText(response.text);
      setTimeout(() => {
        if (isMountedRef.current) onClose();
      }, 2500);
      return;
    }

    if (response.waitForInput) {
      speakAndThenListen(response.text, true);
    } else {
      speakText(response.text);
    }
  };

  const executeAction = async (response: VoiceAIResponse) => {
    if (!business || !response.action) return;
    const { type, data } = response.action;

    if (type === 'log_income' || type === 'log_expense') {
      const txType = type === 'log_income' ? 'income' : 'expense';
      const cat = categories.find((c) =>
        c.type === txType && c.name.toLowerCase().includes((data?.category || '').toLowerCase())
      );
      const pm = paymentMethods.find((p) =>
        p.name.toLowerCase().includes((data?.payment_method || 'cash').toLowerCase())
      );

      const tx = await addTransaction({
        business_id: business.id,
        type: txType,
        amount: data?.amount || 0,
        category_id: cat?.id || null,
        category_name: cat?.name || data?.category || (txType === 'income' ? 'Product Sales' : 'Miscellaneous'),
        payment_method_id: pm?.id || null,
        payment_method_name: pm?.name || data?.payment_method || 'Cash',
        contact_id: null,
        contact_name: data?.contact_name || null,
        description: data?.description || data?.product_name || null,
        receipt_url: null,
        payment_status: 'paid',
        tags: [],
        transaction_date: new Date().toISOString().split('T')[0],
      });

      if (tx) {
        setListenState('success');
        fetchTransactions(business.id);
        const today = new Date().toISOString().split('T')[0];
        fetchDashboardStats(business.id, today, today);
        fetchCashInHand(business.id);
      }
    } else if (type === 'create_invoice') {
      onClose();
      setTimeout(() => navigate('/invoices/create'), 300);
    }
  };

  // ===== SPEECH SYNTHESIS =====
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] || 'en-IN';
    utterance.rate = 0.9;
    setListenState('speaking');
    utterance.onend = () => {
      if (isMountedRef.current) setListenState('waiting');
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakAndThenListen = (text: string, shouldListen: boolean) => {
    if (!('speechSynthesis' in window)) {
      if (shouldListen) setTimeout(() => startListening(), 500);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] || 'en-IN';
    utterance.rate = 0.9;
    setListenState('speaking');
    utterance.onend = () => {
      if (isMountedRef.current && shouldListen) {
        setTimeout(() => {
          if (isMountedRef.current) startListening();
        }, 400);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  // ===== SPEECH RECOGNITION =====
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Try Chrome.');
      setListenState('error');
      return;
    }

    stopListening();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = LANG_CODES[language] || 'en-IN';

    let finalTranscript = '';
    let silenceTimer: any = null;

    recognition.onstart = () => {
      if (isMountedRef.current) {
        setListenState('listening');
        setInterimText('');
        finalTranscript = '';
      }

      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
      }, 8000);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let newFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += t;
        } else {
          interim += t;
        }
      }

      if (newFinal) {
        finalTranscript += newFinal;
        if (newFinal) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try { recognitionRef.current.stop(); } catch {}
            }
          }, 500);
        }
      }

      if (isMountedRef.current) {
        setInterimText(finalTranscript + interim);
      }
    };

    recognition.onend = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (silenceTimer) clearTimeout(silenceTimer);

      const text = finalTranscript.trim();
      if (isMountedRef.current) {
        setInterimText('');
        if (text) {
          processUserInput(text);
        } else {
          setListenState('waiting');
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isMountedRef.current) {
        if (event.error === 'no-speech') {
          setListenState('waiting');
        } else if (event.error === 'aborted') {
          // Ignore aborted — happens when we manually stop
        } else {
          setError(`Mic error: ${event.error}`);
          setListenState('error');
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      setListenState('error');
      setError('Could not start microphone. Please try again.');
    }
  };

  const stopListening = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleMicTap = () => {
    if (listenState === 'listening') {
      stopListening();
    } else if (['waiting', 'idle', 'error'].includes(listenState)) {
      startListening();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-surface-light dark:bg-surface-dark">
      <div className="max-w-[430px] mx-auto w-full flex-1 flex flex-col lg:border-x lg:border-neutral-200 lg:dark:border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/60 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c8ee44] to-[#a3c428] flex items-center justify-center">
              <Volume2 size={16} className="text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Voice Assistant</p>
              <p className={cn('text-[10px] font-semibold',
                listenState === 'listening' ? 'text-red-500' :
                listenState === 'processing' ? 'text-amber-500' :
                listenState === 'speaking' ? 'text-blue-500' :
                listenState === 'success' ? 'text-emerald-500' :
                'text-emerald-500')}>
                {listenState === 'listening' ? 'Listening...' :
                 listenState === 'processing' ? 'Thinking...' :
                 listenState === 'speaking' ? 'Speaking...' :
                 listenState === 'success' ? 'Done!' : 'Ready'}
              </p>
            </div>
          </div>
          <button onClick={() => { stopListening(); window.speechSynthesis?.cancel(); onClose(); }}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {bubbles.map((b, i) => (
            <div key={i} className={cn('flex items-start gap-2.5', b.role === 'user' && 'flex-row-reverse')}>
              {b.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#c8ee44]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Volume2 size={12} className="text-[#8fb02e] dark:text-[#c8ee44]" />
                </div>
              )}
              <div className={cn(
                'max-w-[80%] px-4 py-3 rounded-2xl',
                b.role === 'user'
                  ? 'bg-[#c8ee44] text-black rounded-tr-md'
                  : 'glass-card rounded-tl-md'
              )}>
                <p className={cn('text-sm whitespace-pre-wrap',
                  b.role === 'user' ? 'text-black font-medium' : 'text-neutral-900 dark:text-white')}>
                  {b.text}
                </p>
              </div>
              {b.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mic size={12} className="text-blue-500" />
                </div>
              )}
            </div>
          ))}

          {/* Processing */}
          {listenState === 'processing' && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#c8ee44]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Volume2 size={12} className="text-[#8fb02e] dark:text-[#c8ee44]" />
              </div>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#c8ee44] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Interim text while listening */}
          {interimText && listenState === 'listening' && (
            <div className="flex items-start gap-2.5 flex-row-reverse">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic size={12} className="text-red-500" />
              </div>
              <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-red-500/10 rounded-tr-md">
                <p className="text-sm text-neutral-700 dark:text-zinc-300 italic">{interimText}...</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Mic Area */}
        <div className="px-4 py-5 border-t border-neutral-200/60 dark:border-white/5 flex flex-col items-center gap-3">

          <p className={cn('text-xs font-medium',
            listenState === 'listening' ? 'text-red-500 animate-pulse' :
            listenState === 'speaking' ? 'text-blue-500' :
            listenState === 'success' ? 'text-emerald-500' :
            'text-neutral-400 dark:text-zinc-600')}>
            {listenState === 'listening' ? (language === 'hi' ? 'सुन रहा हूं... बोलिए' : 'Listening... speak now') :
             listenState === 'speaking' ? (language === 'hi' ? 'बोल रहा हूं...' : 'Speaking...') :
             listenState === 'processing' ? (language === 'hi' ? 'सोच रहा हूं...' : 'Thinking...') :
             listenState === 'success' ? '✓' :
             listenState === 'waiting' ? (language === 'hi' ? 'माइक दबाएं' : 'Tap mic to speak') :
             ''}
          </p>

          <div className="relative">
            {listenState === 'listening' && (
              <>
                <div className="absolute inset-0 -m-6 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 -m-3 rounded-full bg-red-500/5 animate-ping" style={{ animationDuration: '1.5s' }} />
              </>
            )}

            <button onClick={handleMicTap}
              disabled={listenState === 'processing' || listenState === 'speaking'}
              className={cn(
                'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                'disabled:opacity-50',
                listenState === 'listening' ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-110' :
                listenState === 'success' ? 'bg-emerald-500 scale-105' :
                'bg-gradient-to-br from-[#c8ee44] to-[#a3c428] shadow-[0_4px_25px_rgba(200,238,68,0.35)]'
              )}>
              {listenState === 'listening' && <MicOff size={28} className="text-white" />}
              {listenState === 'processing' && <Loader2 size={28} className="text-black animate-spin" />}
              {listenState === 'speaking' && <Volume2 size={28} className="text-black animate-pulse" />}
              {listenState === 'success' && <Check size={28} className="text-white" />}
              {['idle', 'waiting', 'error'].includes(listenState) && <Mic size={28} className="text-black" />}
            </button>
          </div>

          {listenState === 'error' && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}