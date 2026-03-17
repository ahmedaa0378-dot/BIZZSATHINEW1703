import { Package } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  name: string;
  price: number;
  stock: number;
  image?: string;
  onClick?: () => void;
}

export function ProductCard({ name, price, stock, image, onClick }: ProductCardProps) {
  const stockStatus = stock === 0 ? 'out' : stock < 10 ? 'low' : 'good';

  const statusConfig = {
    out: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Out of Stock' },
    low: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Low Stock' },
    good: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'In Stock' },
  };

  const config = statusConfig[stockStatus];

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:shadow-md dark:hover:border-white/15 transition-all active:scale-[0.98] backdrop-blur-xl"
    >
      <div className="aspect-square rounded-xl bg-slate-100 dark:bg-white/10 mb-3 overflow-hidden flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Package size={32} className="text-slate-400 dark:text-zinc-500" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 truncate text-left">
        {name}
      </h3>
      <p className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-left">
        {formatINR(price)}
      </p>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', config.bg, config.text)}>
          {config.label}
        </span>
        <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">
          {stock} units
        </span>
      </div>
    </button>
  );
}
