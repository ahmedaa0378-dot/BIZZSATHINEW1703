import { Video as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  amount: number;
  change?: number;
  icon?: LucideIcon;
  variant?: 'default' | 'income' | 'expense' | 'primary';
  className?: string;
}

export function StatCard({ label, amount, change, icon: Icon, variant = 'default', className }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  const variantStyles = {
    default: 'text-slate-900 dark:text-white',
    income: 'text-green-600 dark:text-green-400',
    expense: 'text-red-600 dark:text-red-400',
    primary: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={cn(
      'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl',
      'hover:shadow-md dark:hover:border-white/15 transition-all',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
            <Icon size={16} className="text-slate-600 dark:text-zinc-400" />
          </div>
        )}
      </div>
      <p className={cn('text-2xl font-bold tracking-tight mb-2', variantStyles[variant])}>
        {formatINR(amount)}
      </p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={cn(
            'text-xs font-semibold',
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {isPositive ? '+' : ''}{change}%
          </span>
        </div>
      )}
    </div>
  );
}
