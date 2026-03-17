import { useState, useEffect } from 'react';
import {
  X, Loader2, Check, ChevronDown, Package,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useProductStore, PRODUCT_CATEGORIES, PRODUCT_UNITS, type Product } from '../../stores/productStore';
import { useBusinessStore } from '../../stores/appStore';
import { GST_RATES } from '../../stores/invoiceStore';

interface Props {
  open: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

export default function AddProductModal({ open, onClose, editProduct }: Props) {
  const { addProduct, updateProduct, loading } = useProductStore();
  const { business } = useBusinessStore();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('pcs');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [gstRate, setGstRate] = useState(0);
  const [hsnCode, setHsnCode] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [showMore, setShowMore] = useState(false);
  const [success, setSuccess] = useState(false);

  const isEditing = !!editProduct;

  useEffect(() => {
    if (open && editProduct) {
      setName(editProduct.name);
      setSku(editProduct.sku || '');
      setCategory(editProduct.category);
      setUnit(editProduct.unit);
      setBuyPrice(editProduct.buy_price ? String(editProduct.buy_price) : '');
      setSellPrice(String(editProduct.sell_price));
      setGstRate(editProduct.gst_rate);
      setHsnCode(editProduct.hsn_code || '');
      setCurrentStock(String(editProduct.current_stock));
      setLowStockThreshold(String(editProduct.low_stock_threshold));
      setShowMore(!!editProduct.sku || !!editProduct.hsn_code);
      setSuccess(false);
    } else if (open) {
      setName('');
      setSku('');
      setCategory('General');
      setUnit('pcs');
      setBuyPrice('');
      setSellPrice('');
      setGstRate(0);
      setHsnCode('');
      setCurrentStock('0');
      setLowStockThreshold('10');
      setShowMore(false);
      setSuccess(false);
    }
  }, [open, editProduct]);

  const handleSubmit = async () => {
    if (!name.trim() || !sellPrice || !business) return;

    if (isEditing && editProduct) {
      const ok = await updateProduct(editProduct.id, {
        name: name.trim(),
        sku: sku.trim() || null,
        category,
        unit,
        buy_price: buyPrice ? parseFloat(buyPrice) : 0,
        sell_price: parseFloat(sellPrice),
        gst_rate: gstRate,
        hsn_code: hsnCode.trim() || null,
        low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : 10,
      });
      if (ok) {
        setSuccess(true);
        setTimeout(onClose, 600);
      }
    } else {
      const result = await addProduct({
        business_id: business.id,
        name: name.trim(),
        sku: sku.trim() || null,
        category,
        unit,
        buy_price: buyPrice ? parseFloat(buyPrice) : 0,
        sell_price: parseFloat(sellPrice),
        gst_rate: gstRate,
        hsn_code: hsnCode.trim() || null,
        current_stock: currentStock ? parseFloat(currentStock) : 0,
        low_stock_threshold: lowStockThreshold ? parseFloat(lowStockThreshold) : 10,
      });
      if (result) {
        setSuccess(true);
        setTimeout(onClose, 600);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3
          bg-white dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Product Name *
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Tata Salt 1kg"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium
                bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
          </div>

          {/* Category + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                  border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                  outline-none [&>option]:dark:bg-neutral-900">
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                  border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                  outline-none [&>option]:dark:bg-neutral-900">
                {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Buy Price + Sell Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Buy Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none tabular-nums" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Sell Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none tabular-nums" />
              </div>
            </div>
          </div>

          {/* Stock + Low Stock Threshold */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Opening Stock</label>
                <input type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none tabular-nums" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Low Stock Alert</label>
                <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none tabular-nums" />
              </div>
            </div>
          )}

          {/* GST Rate */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">GST Rate</label>
            <div className="flex gap-2 flex-wrap">
              {GST_RATES.map((r) => (
                <button key={r} onClick={() => setGstRate(r)}
                  className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                    gstRate === r ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* More details */}
          {!showMore && (
            <button onClick={() => setShowMore(true)}
              className="w-full text-center text-sm font-semibold text-[#9abf2a] py-2">
              More details (SKU, HSN) →
            </button>
          )}

          {showMore && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">SKU Code</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-001"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">HSN Code</label>
                <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="1006"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white 
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
              </div>
            </div>
          )}

          {/* Margin indicator */}
          {buyPrice && sellPrice && parseFloat(buyPrice) > 0 && (
            <div className="glass-card p-3 flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-zinc-500">Profit Margin</span>
              <span className={cn('text-sm font-bold',
                ((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(sellPrice) * 100) > 0
                  ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                {((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(sellPrice) * 100).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit}
            disabled={loading || !name.trim() || !sellPrice || success}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              success ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green'
            )}>
            {loading ? <Loader2 size={18} className="animate-spin" /> :
              success ? <><Check size={18} /> {isEditing ? 'Updated!' : 'Added!'}</> :
              <>{isEditing ? 'Update Product' : 'Add Product'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
