import { useState, useEffect } from 'react';
import {
  X, Loader2, Check, ArrowUpCircle, ArrowDownCircle, Settings2,
} from 'lucide-react';
import { cn, formatINR } from '../../lib/utils';
import { useProductStore, type Product } from '../../stores/productStore';
import { useBusinessStore } from '../../stores/appStore';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

type AdjustType = 'in' | 'out' | 'adjustment';

export default function StockAdjustModal({ open, onClose, product }: Props) {
  const { adjustStock, loading } = useProductStore();
  const { business } = useBusinessStore();

  const [type, setType] = useState<AdjustType>('in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setType('in');
      setQuantity('');
      setNotes('');
      setSuccess(false);
    }
  }, [open]);

  if (!open || !product) return null;

  const handleSubmit = async () => {
    if (!quantity || !business) return;
    const ok = await adjustStock(
      business.id, product.id, type,
      parseFloat(quantity), notes || undefined
    );
    if (ok) {
      setSuccess(true);
      setTimeout(onClose, 600);
    }
  };

  const previewStock = () => {
    const q = parseFloat(quantity) || 0;
    const current = Number(product.current_stock);
    if (type === 'in') return current + q;
    if (type === 'out') return Math.max(0, current - q);
    return q; // adjustment = set to this value
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Adjust Stock</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Product info */}
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c8ee44]/10 dark:bg-[#c8ee44]/10 flex items-center justify-center">
              <span className="text-sm font-bold text-[#9abf2a]">{product.current_stock}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500">
                Current: {product.current_stock} {product.unit} · {formatINR(product.sell_price)}/{product.unit}
              </p>
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5">
            <button onClick={() => setType('in')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                type === 'in' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-neutral-500 dark:text-zinc-500')}>
              <ArrowUpCircle size={14} /> Stock In
            </button>
            <button onClick={() => setType('out')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                type === 'out' ? 'bg-red-500/15 text-red-500 dark:text-red-400 shadow-sm' : 'text-neutral-500 dark:text-zinc-500')}>
              <ArrowDownCircle size={14} /> Stock Out
            </button>
            <button onClick={() => setType('adjustment')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                type === 'adjustment' ? 'bg-[#c8ee44]/15 text-[#9abf2a] dark:text-[#c8ee44] shadow-sm' : 'text-neutral-500 dark:text-zinc-500')}>
              <Settings2 size={14} /> Set
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              {type === 'adjustment' ? 'Set Stock To' : 'Quantity'} ({product.unit})
            </label>
            <input type="number" inputMode="numeric" value={quantity}
              onChange={(e) => setQuantity(e.target.value)} placeholder="0"
              className="w-full px-4 py-4 rounded-2xl text-2xl font-bold tabular-nums text-center
                bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-zinc-700
                focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all" />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-zinc-500">New stock will be</span>
              <span className="text-lg font-bold tabular-nums text-neutral-900 dark:text-white">
                {previewStock()} {product.unit}
              </span>
            </div>
          )}

          {/* Notes */}
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full px-4 py-3 rounded-xl text-sm font-medium
              bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
              text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
              focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all" />

          {/* Submit */}
          <button onClick={handleSubmit}
            disabled={loading || !quantity || success}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              success ? 'bg-emerald-500 text-white'
                : type === 'in' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                : type === 'out' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green'
            )}>
            {loading ? <Loader2 size={18} className="animate-spin" /> :
              success ? <><Check size={18} /> Done!</> :
              type === 'adjustment' ? 'Set Stock' : type === 'in' ? 'Add Stock' : 'Remove Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
