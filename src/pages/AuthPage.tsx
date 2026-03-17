import { useState } from 'react';
import { Mail, Phone, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuthStore, useBusinessStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import AnimatedLogo from '../components/brand/AnimatedLogo';

type AuthMode = 'login' | 'signup';
type AuthMethod = 'phone' | 'email';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const navigate = useNavigate();
  const { setUser, setOnboarded } = useAuthStore();
  const { setBusiness } = useBusinessStore();

  const resetForm = () => {
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  // Check if user already has a business and route accordingly
  const checkBusinessAndNavigate = async (userId: string) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, business_name, business_type, business_category, owner_name, onboarding_completed')
      .eq('owner_id', userId)
      .single();

    if (biz && biz.onboarding_completed) {
      setBusiness({
        id: biz.id,
        name: biz.business_name,
        type: biz.business_type,
        category: biz.business_category,
        ownerName: biz.owner_name,
      });
      setOnboarded(true);
      navigate('/');
    } else {
      navigate('/onboarding');
    }
  };

  // ---- EMAIL AUTH ----
  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email ?? '' });
          navigate('/onboarding');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email ?? '' });
          await checkBusinessAndNavigate(data.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ---- PHONE OTP ----
  const handleSendOTP = async () => {
    setError('');
    if (phone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = '+91' + phone.replace(/\D/g, '').slice(-10);
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (otpError) throw otpError;
      setOtpSent(true);
    } catch (err: any) {
      if (err.message?.includes('not enabled') || err.message?.includes('provider')) {
        setError('Phone OTP is not configured yet. Use Email or Google sign-in for now.');
      } else {
        setError(err.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const fullPhone = '+91' + phone.replace(/\D/g, '').slice(-10);
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? '' });
        await checkBusinessAndNavigate(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ---- GOOGLE ----
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      if (err.message?.includes('not enabled') || err.message?.includes('provider')) {
        setError('Google sign-in is not configured yet. Use Email for now.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col">
      <div className="max-w-[430px] mx-auto w-full flex-1 flex flex-col
        lg:border-x lg:border-neutral-200 lg:dark:border-white/5">
        
        {/* Top area with branding */}
        <div className="pt-12 pb-6 px-6 text-center">
          <AnimatedLogo size="lg" />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-2">
            {mode === 'login'
              ? 'Sign in to manage your business'
              : 'Start managing your business in 2 minutes'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="flex-1 px-5 pb-8">
          <div className="premium-card p-6">
            <div className="relative z-10 space-y-5">
              
              {/* Method Toggle */}
              <div className="flex gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5">
                <button
                  onClick={() => { setMethod('phone'); resetForm(); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    method === 'phone'
                      ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-zinc-500'
                  )}
                >
                  <Phone size={16} />
                  Phone
                </button>
                <button
                  onClick={() => { setMethod('email'); resetForm(); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    method === 'email'
                      ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-zinc-500'
                  )}
                >
                  <Mail size={16} />
                  Email
                </button>
              </div>

              {/* PHONE METHOD */}
              {method === 'phone' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                          Phone Number
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-3 rounded-xl
                            bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                            text-sm font-semibold text-neutral-700 dark:text-zinc-300">
                            IN +91
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            maxLength={10}
                            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium
                              bg-neutral-50 dark:bg-white/5 
                              border border-neutral-200 dark:border-white/10
                              text-neutral-900 dark:text-white
                              placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                              focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]
                              outline-none transition-all"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={loading || phone.length < 10}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                          bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
                          shadow-[0_4px_20px_rgba(200,238,68,0.3)] active:scale-[0.98] transition-all
                          disabled:opacity-50 disabled:active:scale-100"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={18} /></>}
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                          Enter OTP sent to +91 {phone}
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full px-4 py-3 rounded-xl text-center text-2xl font-bold tracking-[0.3em]
                            bg-neutral-50 dark:bg-white/5 
                            border border-neutral-200 dark:border-white/10
                            text-neutral-900 dark:text-white
                            placeholder:text-neutral-300 dark:placeholder:text-zinc-700
                            focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]
                            outline-none transition-all tabular-nums"
                        />
                      </div>
                      <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length < 6}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                          bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
                          shadow-[0_4px_20px_rgba(200,238,68,0.3)] active:scale-[0.98] transition-all
                          disabled:opacity-50 disabled:active:scale-100"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify OTP <ArrowRight size={18} /></>}
                      </button>
                      <button
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="w-full text-center text-sm text-[#8fb02e] dark:text-[#c8ee44] font-semibold py-2"
                      >
                        Change number
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* EMAIL METHOD */}
              {method === 'email' && (
                <div className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ahmed Khan"
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium
                          bg-neutral-50 dark:bg-white/5 
                          border border-neutral-200 dark:border-white/10
                          text-neutral-900 dark:text-white
                          placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                          focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]
                          outline-none transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ahmed@example.com"
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium
                        bg-neutral-50 dark:bg-white/5 
                        border border-neutral-200 dark:border-white/10
                        text-neutral-900 dark:text-white
                        placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                        focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]
                        outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-medium
                          bg-neutral-50 dark:bg-white/5 
                          border border-neutral-200 dark:border-white/10
                          text-neutral-900 dark:text-white
                          placeholder:text-neutral-400 dark:placeholder:text-zinc-600
                          focus:ring-2 focus:ring-[#c8ee44]/50 focus:border-[#c8ee44]
                          outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
                          text-neutral-400 dark:text-zinc-500 hover:text-neutral-600 dark:hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleEmailAuth}
                    disabled={loading || !email || !password || (mode === 'signup' && !name)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                      bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black font-semibold text-[15px]
                      shadow-[0_4px_20px_rgba(200,238,68,0.3)] active:scale-[0.98] transition-all
                      disabled:opacity-50 disabled:active:scale-100"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
                <span className="text-xs font-medium text-neutral-400 dark:text-zinc-600">or</span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl
                  bg-neutral-100 dark:bg-white/5 
                  border border-neutral-200 dark:border-white/10
                  text-neutral-900 dark:text-white font-semibold text-[15px]
                  hover:bg-neutral-200 dark:hover:bg-white/8
                  active:scale-[0.98] transition-all"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Switch mode */}
              <p className="text-center text-sm text-neutral-500 dark:text-zinc-500">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetForm(); }}
                  className="text-[#8fb02e] dark:text-[#c8ee44] font-semibold"
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
