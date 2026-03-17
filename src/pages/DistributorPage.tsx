import { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, Phone, MessageCircle, MapPin, Star,
  Filter, ChevronRight, X, Truck, Clock, Shield, Plus,
  Loader2, Check, Navigation, Inbox, Building2,
} from 'lucide-react';
import { cn, formatINR } from '../lib/utils';
import { useDistributorStore, DISTRIBUTOR_CATEGORIES, type Distributor } from '../stores/distributorStore';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

export default function DistributorPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Distributor | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { distributors, fetchDistributors, loading } = useDistributorStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDistributors(business?.city || '', category || undefined);
  }, [category]);

  const filtered = distributors.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.products?.toLowerCase().includes(q) ||
      d.categories.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <PageWrapper>
      <Header title="Find Distributors" onBack={() => navigate(-1)} />

      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Search */}
        <div className="glass-card flex items-center gap-3 px-4 py-3">
          <Search size={18} className="text-neutral-400 flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search distributors, products..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 outline-none" />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          <button onClick={() => setCategory('')}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              !category ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400')}>
            All
          </button>
          {DISTRIBUTOR_CATEGORIES.slice(0, 8).map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                category === c ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400')}>
              {c}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-neutral-400 dark:text-zinc-600">{filtered.length} distributors found</p>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <Building2 size={24} className="text-neutral-400 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">No distributors found</p>
            <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((dist) => (
              <button key={dist.id} onClick={() => setSelected(dist)}
                className="w-full glass-card p-4 text-left active:scale-[0.98] transition-all">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-blue-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{dist.name}</p>
                      {dist.is_verified && (
                        <Shield size={12} className="text-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Categories */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {dist.categories.slice(0, 3).map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-zinc-400">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Rating + Location */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white">{dist.rating}</span>
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-600">({dist.rating_count})</span>
                      </div>
                      {dist.city && (
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-neutral-400" />
                          <span className="text-[10px] text-neutral-500 dark:text-zinc-500">{dist.city}</span>
                        </div>
                      )}
                      {dist.delivers && (
                        <div className="flex items-center gap-1">
                          <Truck size={10} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Delivers</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-neutral-300 dark:text-zinc-700 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB — List your business */}
      <button onClick={() => setShowAdd(true)}
        className="fixed z-40 w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center
          shadow-glow-green active:scale-95 transition-transform"
        style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)', left: '16px' }}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Detail Sheet */}
      {selected && (
        <DistributorDetail
          distributor={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Add Distributor */}
      {showAdd && (
        <AddDistributorSheet onClose={() => setShowAdd(false)} />
      )}
    </PageWrapper>
  );
}

// ========== DISTRIBUTOR DETAIL ==========
function DistributorDetail({ distributor: d, onClose }: { distributor: Distributor; onClose: () => void }) {
  const { rateDistributor } = useDistributorStore();
  const { user } = useAuthStore();
  const [myRating, setMyRating] = useState(0);
  const [rated, setRated] = useState(false);

  const handleRate = async (stars: number) => {
    if (!user) return;
    setMyRating(stars);
    const ok = await rateDistributor(d.id, user.id, stars);
    if (ok) setRated(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-3
          bg-white dark:bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Distributor Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">

          {/* Profile */}
          <div className="premium-card p-5">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Building2 size={24} className="text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{d.name}</p>
                    {d.is_verified && <Shield size={14} className="text-blue-500" />}
                  </div>
                  {d.contact_person && <p className="text-sm text-neutral-500 dark:text-zinc-400">{d.contact_person}</p>}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16}
                    className={cn(s <= d.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300 dark:text-zinc-600')} />
                ))}
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{d.rating}</span>
                <span className="text-xs text-neutral-400 dark:text-zinc-600">({d.rating_count} ratings)</span>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {d.phone && (
                  <a href={`tel:${d.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <Phone size={14} /> Call
                  </a>
                )}
                {(d.whatsapp || d.phone) && (
                  <a href={`https://wa.me/91${d.whatsapp || d.phone}`} target="_blank" rel="noopener"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent-dark dark:text-accent text-xs font-semibold">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {d.latitude && d.longitude && (
                  <a href={`https://maps.google.com/?q=${d.latitude},${d.longitude}`} target="_blank" rel="noopener"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    <Navigation size={14} /> Directions
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="glass-card divide-y divide-neutral-100 dark:divide-white/5 overflow-hidden">
            {d.address && <InfoRow icon={MapPin} label="Address" value={`${d.address}, ${d.city}, ${d.state}`} />}
            {d.products && <InfoRow icon={Building2} label="Products" value={d.products} />}
            <InfoRow icon={Building2} label="Min Order" value={formatINR(d.min_order_amount)} />
            <InfoRow icon={Truck} label="Delivery" value={d.delivers ? `Yes (${d.delivery_radius_km}km radius)` : 'No delivery'} />
            {d.categories.length > 0 && <InfoRow icon={Building2} label="Categories" value={d.categories.join(', ')} />}
          </div>

          {/* Rate */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
              {rated ? 'Thanks for rating!' : 'Rate this distributor'}
            </p>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => handleRate(s)} disabled={rated}
                  className="p-1 active:scale-110 transition-transform">
                  <Star size={28}
                    className={cn(
                      s <= myRating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300 dark:text-zinc-600',
                      !rated && 'hover:text-amber-400')} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== ADD DISTRIBUTOR ==========
function AddDistributorSheet({ onClose }: { onClose: () => void }) {
  const { addDistributor } = useDistributorStore();
  const { business } = useBusinessStore();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [products, setProducts] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [delivers, setDelivers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleCat = (c: string) => {
    setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addDistributor({
      business_id: business?.id || null,
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      whatsapp: phone.trim() || null,
      city: city.trim() || null,
      state: null,
      categories: cats,
      products: products.trim() || null,
      min_order_amount: minOrder ? parseFloat(minOrder) : 0,
      delivers,
      is_self_listed: true,
      is_active: true,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto
        bg-white dark:bg-[#0a0a0a] rounded-t-3xl animate-slide-up">

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">List a Distributor</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          <SmallInput label="Business Name *" value={name} onChange={setName} placeholder="Sharma FMCG" />
          <SmallInput label="Contact Person" value={contactPerson} onChange={setContactPerson} placeholder="Rajesh Sharma" />
          <SmallInput label="Phone" value={phone} onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
          <SmallInput label="City" value={city} onChange={setCity} placeholder="Hyderabad" />
          <SmallInput label="Products" value={products} onChange={setProducts} placeholder="Rice, Dal, Sugar, Atta..." />
          <SmallInput label="Min Order (₹)" value={minOrder} onChange={setMinOrder} placeholder="5000" />

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Categories</label>
            <div className="flex gap-2 flex-wrap">
              {DISTRIBUTOR_CATEGORIES.slice(0, 10).map((c) => (
                <button key={c} onClick={() => toggleCat(c)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    cats.includes(c) ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400')}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Delivers */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Offers Delivery</span>
            </div>
            <button onClick={() => setDelivers(!delivers)}
              className={cn('relative w-12 h-7 rounded-full transition-colors duration-300',
                delivers ? 'bg-accent' : 'bg-neutral-300 dark:bg-white/15')}>
              <span className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300',
                delivers ? 'translate-x-5.5' : 'translate-x-0.5')} />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving || !name.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
            {saving ? <Loader2 size={18} className="animate-spin" /> :
              saved ? <><Check size={18} /> Listed!</> : 'List Distributor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== SHARED ==========
function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14
      bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
      dark:bg-black/80 dark:border-white/5">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
        <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
      </button>
      <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">{title}</h1>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon size={16} className="text-neutral-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600">{label}</p>
        <p className="text-sm text-neutral-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SmallInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all" />
    </div>
  );
}
