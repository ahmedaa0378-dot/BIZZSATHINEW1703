import { useState, useEffect } from 'react';
import { Search, Plus, Package, CreditCard as Edit2, ArrowUpDown, Inbox, Trash2 } from 'lucide-react';
import { cn, formatINR } from '../lib/utils';
import { useProductStore, getStockStatus, type Product, type StockStatus } from '../stores/productStore';
import { useBusinessStore } from '../stores/appStore';
import AddProductModal from '../components/stock/AddProductModal';
import StockAdjustModal from '../components/stock/StockAdjustModal';
import { useTranslation } from '../lib/i18n';

const STATUS_CONFIG: Record<StockStatus, { label: string; text: string; bg: string }> = {
  in_stock: { label: 'In Stock', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  low: { label: 'Low Stock', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  out: { label: 'Out', text: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
};

type StockFilter = 'all' | 'in_stock' | 'low' | 'out';

export default function StockPage() {
  const [filter, setFilter] = useState<StockFilter>('all');
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { t } = useTranslation();
  const { products, summary, categories, fetchProducts, fetchSummary, deleteProduct } = useProductStore();
  const { business } = useBusinessStore();

  useEffect(() => {
    if (business?.id) {
      fetchProducts(business.id);
      fetchSummary(business.id);
    }
  }, [business?.id]);

  const refreshData = () => {
    if (business?.id) {
      fetchProducts(business.id);
      fetchSummary(business.id);
    }
  };

  const allCategories = ['All', ...categories];

  const filtered = products
    .filter((p) => {
      if (filter === 'all') return true;
      return getStockStatus(p) === filter;
    })
    .filter((p) => catFilter === 'All' || p.category === catFilter)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    });

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await deleteProduct(id);
      setConfirmDelete(null);
      refreshData();
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const totalProducts = summary?.total_products ?? products.length;
  const lowStock = summary?.low_stock_count ?? 0;
  const outOfStock = summary?.out_of_stock_count ?? 0;
  const stockValue = summary?.total_stock_value ?? 0;

  return (
    <>
      <div className="px-4 pt-3 pb-4 space-y-4 animate-fade-in">

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          <SummaryCard label={t('total_items')} value={totalProducts} color="neutral" />
          <SummaryCard label={t('in_stock')} value={totalProducts - lowStock - outOfStock} color="emerald" />
          <SummaryCard label={t('low_stock')} value={lowStock} color="amber" />
          <SummaryCard label={t('out_of_stock')} value={outOfStock} color="red" />
        </div>

        {/* Stock Value */}
        <div className="premium-card p-4">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-0.5">{t('total_stock_value')}</p>
              <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatINR(stockValue)}</p>
            </div>
            <Package size={20} className="text-neutral-400 dark:text-zinc-600" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'in_stock', 'low', 'out'] as StockFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                filter === f ? 'bg-accent text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
              {f === 'all' ? 'All' : f === 'in_stock' ? 'In Stock' : f === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="glass-card flex items-center gap-3 px-4 py-3">
          <Search size={18} className="text-neutral-400 dark:text-zinc-500 flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_products')}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
        </div>

        {/* Category Chips */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {allCategories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                  catFilter === c ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/8 dark:text-zinc-400')}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
              <Package size={24} className="text-neutral-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {search ? 'No products found' : 'No products yet'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">
              {search ? 'Try different search' : 'Add your first product to track inventory'}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)}
                className="mt-1 px-5 py-2 rounded-xl bg-accent text-black text-xs font-semibold active:scale-95 transition-transform">
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => {
              const status = getStockStatus(p);
              const sc = STATUS_CONFIG[status];
              return (
                <div key={p.id} className="glass-card overflow-hidden">
                  {/* Image area */}
                  <div className="h-24 bg-neutral-100 dark:bg-white/5 flex items-center justify-center relative">
                    <Package size={24} className="text-neutral-300 dark:text-zinc-700" />
                    {/* Category badge */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[9px] font-semibold text-white">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-white mt-0.5">
                      {formatINR(p.sell_price)}
                    </p>

                    {/* Stock badge */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', sc.text, sc.bg)}>
                        {sc.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-zinc-500 tabular-nums">
                        {p.current_stock} {p.unit}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-neutral-100 dark:border-white/5">
                      <button onClick={() => setAdjustProduct(p)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                          bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                        <ArrowUpDown size={10} /> Stock
                      </button>
                      <button onClick={() => { setEditProduct(p); setShowAdd(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg
                          bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-zinc-400 text-[10px] font-semibold">
                        <Edit2 size={10} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className={cn('px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center',
                          confirmDelete === p.id
                            ? 'bg-red-500 text-white'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-500')}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setEditProduct(null); setShowAdd(true); }}
        className="fixed z-40 w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center
          shadow-glow-green active:scale-95 transition-transform"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)', left: '16px' }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Add/Edit Product */}
      <AddProductModal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditProduct(null); refreshData(); }}
        editProduct={editProduct}
      />

      {/* Stock Adjust */}
      <StockAdjustModal
        open={!!adjustProduct}
        onClose={() => { setAdjustProduct(null); refreshData(); }}
        product={adjustProduct}
      />
    </>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const textColor: Record<string, string> = {
    neutral: 'text-neutral-900 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-500 dark:text-red-400',
  };
  return (
    <div className="glass-card p-2.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums mt-0.5', textColor[color])}>{value}</p>
    </div>
  );
}
