import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, MapPin, Loader2, Check,
  Store, Warehouse, Wrench, Factory, ChevronDown, LocateFixed,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import AnimatedLogo from '../components/brand/AnimatedLogo';

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail', icon: Store, desc: 'Kirana, clothing, electronics, pharmacy' },
  { value: 'wholesale', label: 'Wholesale', icon: Warehouse, desc: 'FMCG, textiles, building materials' },
  { value: 'services', label: 'Services', icon: Wrench, desc: 'Restaurant, salon, repair, coaching' },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory, desc: 'F&B, textiles, furniture, metal' },
] as const;

const CATEGORIES: Record<string, string[]> = {
  retail: ['Kirana/General Store', 'Clothing & Textiles', 'Electronics & Appliances', 'Footwear & Accessories', 'Pharmacy/Medical Store', 'Hardware & Tools', 'Stationery & Books', 'Fruits & Vegetables', 'Cosmetics & Beauty', 'Mobile & Recharge Shop', 'Jewellery', 'Optical Store', 'Other Retail'],
  wholesale: ['FMCG/Grocery', 'Textiles & Garments', 'Electronics & Components', 'Building Materials', 'Agricultural Products', 'Chemicals & Fertilizers', 'Paper & Packaging', 'Auto Parts', 'Other Wholesale'],
  services: ['Restaurant/Dhaba/Cafe', 'Salon & Beauty Parlour', 'Repair & Maintenance', 'Tailoring & Alteration', 'Laundry & Dry Cleaning', 'Coaching/Tuition Centre', 'Photography & Videography', 'Travel & Transport', 'Printing & Xerox', 'Healthcare/Clinic', 'Gym & Fitness', 'CA/Tax Consultant', 'IT Services/Freelancer', 'Event Management', 'Catering', 'Other Services'],
  manufacturing: ['Food & Beverage', 'Textiles & Garments', 'Furniture & Woodwork', 'Metal & Fabrication', 'Plastics & Packaging', 'Handicrafts & Artisan', 'Leather Goods', 'Chemical Products', 'Paper & Printing', 'Other Manufacturing'],
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Step 2
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Step 3
  const [businessType, setBusinessType] = useState('');
  const [category, setCategory] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  // Step 4
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const navigate = useNavigate();
  const { user, setOnboarded } = useAuthStore();
  const { setBusiness } = useBusinessStore();

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Welcome step
      case 2: return businessName.trim() && ownerName.trim();
      case 3: return businessType && category;
      case 4: return city.trim() && state.trim();
      default: return false;
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Create business
      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          business_name: businessName.trim(),
          owner_name: ownerName.trim(),
          business_type: businessType,
          business_category: category,
          address_line1: address1.trim(),
          address_line2: address2.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          latitude: lat,
          longitude: lng,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (bizError) throw bizError;

      // Update user profile with business_id
      await supabase
        .from('user_profiles')
        .update({
          business_id: biz.id,
          full_name: ownerName.trim(),
        })
        .eq('id', user.id);

      // Seed default categories & payment methods
      await supabase.rpc('seed_default_data', { p_business_id: biz.id });

      setBusiness({
        id: biz.id,
        name: biz.business_name,
        type: biz.business_type,
        category: biz.business_category,
        ownerName: biz.owner_name,
      });
      setOnboarded(true);
      navigate('/');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
      <div className="max-w-[430px] mx-auto w-full flex-1 flex flex-col
        lg:border-x lg:border-neutral-200 lg:dark:border-white/5">

        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-neutral-200 dark:bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    s <= step ? 'bg-accent w-full' : 'w-0'
                  )}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-2">Step {step} of 4</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pb-6 flex flex-col">

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="flex-1 flex flex-col justify-center animate-fade-in">
              <AnimatedLogo size="lg" />
              <h1 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-3 mt-8">
                Let's set up your business
              </h1>
              <p className="text-sm text-center text-neutral-500 dark:text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                Just 3 quick steps to get your complete business operating system ready.
              </p>
            </div>
          )}

          {/* STEP 2: Business Basics */}
          {step === 2 && (
            <div className="flex-1 animate-fade-in pt-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Business details</h2>
              <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-6">Tell us about your business</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Khan General Store"
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium
                      bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                      text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                      focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ahmed Khan"
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium
                      bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                      text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                      focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Business Type & Category */}
          {step === 3 && (
            <div className="flex-1 animate-fade-in pt-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">What kind of business?</h2>
              <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-6">This helps us customize your experience</p>

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {BUSINESS_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  const active = businessType === bt.value;
                  return (
                    <button
                      key={bt.value}
                      onClick={() => { setBusinessType(bt.value); setCategory(''); setShowCategories(false); }}
                      className={cn(
                        'p-4 rounded-2xl text-left transition-all active:scale-[0.97]',
                        active
                          ? 'bg-[#c8ee44]/10 dark:bg-[#c8ee44]/15 border-2 border-[#c8ee44] ring-2 ring-[#c8ee44]/20'
                          : 'glass-card hover:border-neutral-300 dark:hover:border-white/15'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                        active ? 'bg-[#c8ee44]/20' : 'bg-neutral-100 dark:bg-white/5'
                      )}>
                        <Icon size={20} className={active ? 'text-[#9abf2a]' : 'text-neutral-500 dark:text-zinc-400'} />
                      </div>
                      <p className={cn('text-sm font-semibold', active ? 'text-[#9abf2a] dark:text-[#c8ee44]' : 'text-neutral-900 dark:text-white')}>
                        {bt.label}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-zinc-500 mt-0.5 line-clamp-1">{bt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Category Dropdown */}
              {businessType && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                    Category *
                  </label>
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium
                      bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                      text-neutral-900 dark:text-white transition-all"
                  >
                    <span className={category ? '' : 'text-neutral-400 dark:text-zinc-600'}>
                      {category || 'Select category'}
                    </span>
                    <ChevronDown size={16} className={cn('transition-transform', showCategories && 'rotate-180')} />
                  </button>

                  {showCategories && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl
                      bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-lg">
                      {CATEGORIES[businessType]?.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setShowCategories(false); }}
                          className={cn(
                            'w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors',
                            category === cat
                              ? 'text-[#9abf2a] font-semibold bg-[#c8ee44]/10 dark:bg-[#c8ee44]/10'
                              : 'text-neutral-700 dark:text-zinc-300'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Location */}
          {step === 4 && (
            <div className="flex-1 animate-fade-in pt-4">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">Business location</h2>
              <p className="text-sm text-neutral-500 dark:text-zinc-400 mb-6">Where is your business based?</p>

              {/* GPS Button */}
              <button
                onClick={handleGPS}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mb-5
                  bg-accent/10 dark:bg-accent/10 border border-accent/20
                  text-accent-dark dark:text-accent font-semibold text-sm
                  hover:bg-accent/15 active:scale-[0.98] transition-all"
              >
                {locating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LocateFixed size={16} />
                )}
                {locating ? 'Detecting location...' : lat ? '📍 Location detected' : 'Auto-detect my location'}
              </button>

              <div className="space-y-3">
                <input
                  value={address1} onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Address line 1"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                    focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                />
                <input
                  value={address2} onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Address line 2 (optional)"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white
                    placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                    focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="City *"
                    className="px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                      border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white
                      placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                      focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                  />
                  <input
                    value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Pincode"
                    maxLength={6}
                    className="px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 
                      border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white
                      placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                      focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all"
                  />
                </div>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5
                    border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white
                    focus:ring-2 focus:ring-[#c8ee44]/50 outline-none transition-all
                    [&>option]:dark:bg-neutral-900"
                >
                  <option value="">Select State *</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center justify-center w-12 h-12 rounded-2xl
                  bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                  text-neutral-600 dark:text-zinc-400 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <button
              onClick={() => {
                if (step < 4) setStep(step + 1);
                else handleComplete();
              }}
              disabled={!canProceed() || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
                shadow-glow-green active:scale-[0.98] transition-all
                disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : step === 4 ? (
                <><Check size={18} /> Complete Setup</>
              ) : (
                <>Continue <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
