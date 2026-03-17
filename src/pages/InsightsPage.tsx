import { useState, useEffect } from 'react';
import {
  ArrowLeft, Sparkles, Loader2, X, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, Package, FileText, DollarSign,
  Zap, Star, Clock, RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useInsightsStore, type Insight } from '../stores/insightsStore';
import { useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; icon: typeof Lightbulb; color: string }> = {
  info: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: Lightbulb, color: 'text-blue-500' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: AlertTriangle, color: 'text-amber-500' },
  critical: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', icon: AlertTriangle, color: 'text-red-500' },
  opportunity: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: TrendingUp, color: 'text-emerald-500' },
};

const TYPE_ICONS: Record<string, typeof Zap> = {
  spending_alert: Zap,
  revenue_trend: TrendingUp,
  margin_watch: DollarSign,
  stock_prediction: Package,
  invoice_alert: FileText,
  cash_flow: DollarSign,
  festival_opportunity: Star,
  best_selling: TrendingUp,
  customer_alert: Clock,
  payment_pattern: Clock,
};

export default function InsightsPage() {
  const navigate = useNavigate();
  const { insights, loading, fetchInsights, generateInsights, dismissInsight } = useInsightsStore();
  const { business } = useBusinessStore();

  useEffect(() => {
    if (business?.id) fetchInsights(business.id);
  }, [business?.id]);

  const handleGenerate = () => {
    if (business?.id) generateInsights(business.id);
  };

  return (
    <PageWrapper>
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
        bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
        dark:bg-black/80 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
          <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">AI Insights</h1>
        </div>
      </div>

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full premium-card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all">
          <div className="relative z-10 flex items-center gap-4 w-full">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
              {loading ? <Loader2 size={20} className="text-accent animate-spin" /> : <Sparkles size={20} className="text-accent" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {loading ? 'Analyzing your business...' : 'Generate Fresh Insights'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">
                AI analyzes your transactions, stock & invoices
              </p>
            </div>
            {!loading && <RefreshCw size={16} className="text-neutral-400 dark:text-zinc-600" />}
          </div>
        </button>

        {/* Insights List */}
        {insights.length === 0 && !loading ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <Sparkles size={24} className="text-neutral-400 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">No insights yet</p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
              Tap "Generate Fresh Insights" to get AI-powered business analysis
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const sev = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
              const TypeIcon = TYPE_ICONS[insight.type] || Lightbulb;
              const SevIcon = sev.icon;
              return (
                <div key={insight.id} className={cn('glass-card p-4 border-l-[3px]', sev.border)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', sev.bg)}>
                      <TypeIcon size={16} className={sev.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{insight.title}</p>
                        {!insight.is_read && (
                          <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-zinc-400 leading-relaxed">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase', sev.bg, sev.color)}>
                          {insight.severity}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-600">
                          {new Date(insight.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => dismissInsight(insight.id)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
