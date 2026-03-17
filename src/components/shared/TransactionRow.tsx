import { Video as LucideIcon } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface TransactionRowProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  amount: number;
  type: 'income' | 'expense';
  paymentMethod?: string;
  iconBg?: string;
  onClick?: () => void;
}

export function TransactionRow({
  icon: Icon,
  title,
  subtitle,
  amount,
  type,
  paymentMethod,
  iconBg = 'bg-slate-100 dark:bg-white/10',
  onClick,
}: TransactionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors active:scale-[0.99]"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon size={20} className="text-slate-700 dark:text-zinc-300" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-500 truncate">
          {subtitle}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <p className={cn(
          'text-sm font-bold',
          type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {type === 'income' ? '+' : '-'}{formatINR(amount)}
        </p>
        {paymentMethod && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-400 mt-1">
            {paymentMethod}
          </span>
        )}
      </div>
    </button>
  );
}
