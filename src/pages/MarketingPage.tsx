import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Plus, Sparkles, Loader2, Calendar, Download,
  MessageCircle, Copy, Check, Trash2,
  ChevronRight, X, Wand2, Share2, ExternalLink, Image, Palette,
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useMarketingStore, POST_TYPES, TONES, generateCaption } from '../stores/marketingStore';
import { useBusinessStore } from '../stores/appStore';
import { useLanguageStore } from '../stores/languageStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

type View = 'main' | 'create' | 'banner' | 'festivals';

export default function MarketingPage() {
  const [view, setView] = useState<View>('main');
  const navigate = useNavigate();

  return view === 'create' ? (
    <CreatePost onBack={() => setView('main')} />
  ) : view === 'banner' ? (
    <DesignBanner onBack={() => setView('main')} />
  ) : view === 'festivals' ? (
    <FestivalCalendar onBack={() => setView('main')} />
  ) : (
    <MainView
      onNavigateBack={() => navigate(-1)}
      onCreate={() => setView('create')}
      onBanner={() => setView('banner')}
      onFestivals={() => setView('festivals')}
    />
  );
}

// ========== MAIN VIEW ==========
function MainView({ onNavigateBack, onCreate, onBanner, onFestivals }: {
  onNavigateBack: () => void; onCreate: () => void; onBanner: () => void; onFestivals: () => void;
}) {
  const { posts, upcomingFestivals, fetchPosts, fetchFestivals, deletePost } = useMarketingStore();
  const { business } = useBusinessStore();

  useEffect(() => {
    if (business?.id) fetchPosts(business.id);
    fetchFestivals();
  }, [business?.id]);

  return (
    <PageWrapper>
      <Header title="Marketing Suite" onBack={onNavigateBack} />
      <div className="px-4 pt-3 pb-24 space-y-4 animate-fade-in">

        {/* Quick Actions — 3 cards */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onCreate}
              className="premium-card p-4 text-left active:scale-[0.98] transition-all">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                  <Wand2 size={18} className="text-accent-dark dark:text-accent" />
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Create Post</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">AI captions + share</p>
              </div>
            </button>
            <button onClick={onBanner}
              className="premium-card p-4 text-left active:scale-[0.98] transition-all">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-3">
                  <Palette size={18} className="text-pink-500" />
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Design Banner</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">Pro templates</p>
              </div>
            </button>
          </div>
          <button onClick={onFestivals}
            className="w-full premium-card p-4 text-left active:scale-[0.98] transition-all">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Calendar size={18} className="text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Festival Calendar</p>
                <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">{upcomingFestivals.length} upcoming — plan your campaigns</p>
              </div>
            </div>
          </button>
        </div>

        {/* Upcoming Festivals Alert */}
        {upcomingFestivals.length > 0 && (
          <div className="accent-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-accent-dark dark:text-accent" />
              <p className="text-xs font-semibold text-accent-dark dark:text-accent">Upcoming Festivals</p>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
              {upcomingFestivals.slice(0, 4).map((f) => (
                <div key={f.id} className="glass-card px-3 py-2 min-w-[120px] flex-shrink-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">{f.name}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-500 mt-0.5">
                    {new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Posts */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">Saved Posts</p>
          {posts.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Wand2 size={24} className="text-neutral-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-500 dark:text-zinc-400">No posts yet</p>
              <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-1">Create your first AI-powered post</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => {
                const pt = POST_TYPES.find((t) => t.value === post.post_type);
                return (
                  <div key={post.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{pt?.emoji || '📝'}</span>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{post.title}</p>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-zinc-500 line-clamp-2">{post.caption}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-zinc-600 mt-1.5">
                          {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <button onClick={() => deletePost(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

// ========== BANNER TEMPLATES ==========
const BANNER_TEMPLATES = [
  {
    id: 'bold_dark',
    name: 'Bold Dark',
    desc: 'CRED-style premium',
    preview: { bg: '#0a0a0a', accent: '#c8ee44', text: '#ffffff' },
    render: (ctx: CanvasRenderingContext2D, W: number, H: number, headline: string, subtitle: string, cta: string, businessName: string) => {
      // Background
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Accent glow
      const glow = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 400);
      glow.addColorStop(0, 'rgba(200, 238, 68, 0.15)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Accent bar
      ctx.fillStyle = '#c8ee44';
      ctx.fillRect(80, 180, 60, 6);

      // Headline
      ctx.font = 'bold 72px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      wrapAndDraw(ctx, headline, 80, 260, W - 160, 84);

      // Subtitle
      const headLines = wrapText(ctx, headline, W - 160, 72);
      const subY = 260 + headLines.length * 84 + 40;
      ctx.font = '36px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#a1a1aa';
      wrapAndDraw(ctx, subtitle, 80, subY, W - 160, 46);

      // CTA button
      if (cta) {
        const ctaY = H - 200;
        ctx.fillStyle = '#c8ee44';
        roundRect(ctx, 80, ctaY, Math.min(ctx.measureText(cta).width + 80, W - 160), 64, 16);
        ctx.fill();
        ctx.font = 'bold 30px "DM Sans", Arial, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(cta, 120, ctaY + 42);
      }

      // Branding
      drawBranding(ctx, W, H, businessName, '#c8ee44', '#52525b');
    },
  },
  {
    id: 'clean_white',
    name: 'Clean White',
    desc: 'Professional & minimal',
    preview: { bg: '#ffffff', accent: '#3b82f6', text: '#0f172a' },
    render: (ctx: CanvasRenderingContext2D, W: number, H: number, headline: string, subtitle: string, cta: string, businessName: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Top accent border
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, W, 8);

      // Side accent
      ctx.fillStyle = '#eff6ff';
      ctx.fillRect(0, 0, 8, H);

      // Headline
      ctx.font = 'bold 68px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#0f172a';
      wrapAndDraw(ctx, headline, 80, 200, W - 160, 80);

      // Subtitle
      const headLines = wrapText(ctx, headline, W - 160, 68);
      const subY = 200 + headLines.length * 80 + 30;
      ctx.font = '34px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      wrapAndDraw(ctx, subtitle, 80, subY, W - 160, 44);

      // CTA
      if (cta) {
        const ctaY = H - 200;
        ctx.fillStyle = '#3b82f6';
        roundRect(ctx, 80, ctaY, Math.min(ctx.measureText(cta).width + 80, W - 160), 64, 16);
        ctx.fill();
        ctx.font = 'bold 30px "DM Sans", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cta, 120, ctaY + 42);
      }

      drawBranding(ctx, W, H, businessName, '#3b82f6', '#94a3b8');
    },
  },
  {
    id: 'festive_gold',
    name: 'Festive Gold',
    desc: 'Diwali, Holi, Eid vibes',
    preview: { bg: '#1a0a2e', accent: '#f59e0b', text: '#fef3c7' },
    render: (ctx: CanvasRenderingContext2D, W: number, H: number, headline: string, subtitle: string, cta: string, businessName: string) => {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#1a0a2e');
      grad.addColorStop(0.5, '#2d1055');
      grad.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Gold particles
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${Math.random() * 0.3 + 0.1})`;
        ctx.fill();
      }

      // Gold glow
      const glow = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, 350);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Decorative border
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 3;
      roundRect(ctx, 40, 40, W - 80, H - 80, 20);
      ctx.stroke();

      // Headline
      ctx.font = 'bold 70px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#fef3c7';
      wrapAndDraw(ctx, headline, 80, 220, W - 160, 84);

      const headLines = wrapText(ctx, headline, W - 160, 70);
      const subY = 220 + headLines.length * 84 + 30;
      ctx.font = '34px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#d4a574';
      wrapAndDraw(ctx, subtitle, 80, subY, W - 160, 44);

      if (cta) {
        const ctaY = H - 200;
        ctx.fillStyle = '#f59e0b';
        roundRect(ctx, 80, ctaY, Math.min(ctx.measureText(cta).width + 80, W - 160), 64, 16);
        ctx.fill();
        ctx.font = 'bold 30px "DM Sans", Arial, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(cta, 120, ctaY + 42);
      }

      drawBranding(ctx, W, H, businessName, '#f59e0b', '#7c5e3c');
    },
  },
  {
    id: 'sale_red',
    name: 'Sale Red',
    desc: 'Urgent discounts & offers',
    preview: { bg: '#1a0000', accent: '#ef4444', text: '#ffffff' },
    render: (ctx: CanvasRenderingContext2D, W: number, H: number, headline: string, subtitle: string, cta: string, businessName: string) => {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#1a0000');
      grad.addColorStop(0.5, '#2d0a0a');
      grad.addColorStop(1, '#0a0000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Red glow
      const glow = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, 400);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // SALE sticker
      ctx.save();
      ctx.translate(W - 160, 160);
      ctx.rotate(-0.2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 32px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('SALE', 0, 10);
      ctx.restore();
      ctx.textAlign = 'left';

      // Headline
      ctx.font = 'bold 74px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      wrapAndDraw(ctx, headline, 80, 240, W - 280, 88);

      const headLines = wrapText(ctx, headline, W - 280, 74);
      const subY = 240 + headLines.length * 88 + 30;
      ctx.font = '36px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#fca5a5';
      wrapAndDraw(ctx, subtitle, 80, subY, W - 160, 46);

      if (cta) {
        const ctaY = H - 200;
        ctx.fillStyle = '#ef4444';
        roundRect(ctx, 80, ctaY, Math.min(ctx.measureText(cta).width + 80, W - 160), 64, 16);
        ctx.fill();
        ctx.font = 'bold 30px "DM Sans", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cta, 120, ctaY + 42);
      }

      drawBranding(ctx, W, H, businessName, '#ef4444', '#7f1d1d');
    },
  },
  {
    id: 'modern_blue',
    name: 'Modern Blue',
    desc: 'Corporate & trustworthy',
    preview: { bg: '#0f172a', accent: '#38bdf8', text: '#f0f9ff' },
    render: (ctx: CanvasRenderingContext2D, W: number, H: number, headline: string, subtitle: string, cta: string, businessName: string) => {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Blue glow
      const glow = ctx.createRadialGradient(W * 0.7, H * 0.8, 0, W * 0.7, H * 0.8, 350);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Geometric accent lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.6);
      ctx.lineTo(W, H * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, H * 0.65);
      ctx.lineTo(W, H * 0.45);
      ctx.stroke();

      // Accent bar
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(80, 180, 50, 5);

      ctx.font = 'bold 68px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#f0f9ff';
      wrapAndDraw(ctx, headline, 80, 250, W - 160, 80);

      const headLines = wrapText(ctx, headline, W - 160, 68);
      const subY = 250 + headLines.length * 80 + 30;
      ctx.font = '34px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = '#94a3b8';
      wrapAndDraw(ctx, subtitle, 80, subY, W - 160, 44);

      if (cta) {
        const ctaY = H - 200;
        ctx.fillStyle = '#38bdf8';
        roundRect(ctx, 80, ctaY, Math.min(ctx.measureText(cta).width + 80, W - 160), 64, 16);
        ctx.fill();
        ctx.font = 'bold 30px "DM Sans", Arial, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(cta, 120, ctaY + 42);
      }

      drawBranding(ctx, W, H, businessName, '#38bdf8', '#475569');
    },
  },
];

// ========== DESIGN BANNER ==========
function DesignBanner({ onBack }: { onBack: () => void }) {
  const { business } = useBusinessStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [template, setTemplate] = useState('bold_dark');
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [cta, setCta] = useState('');
  const [downloading, setDownloading] = useState(false);

  const selectedTemplate = BANNER_TEMPLATES.find((t) => t.id === template)!;

  // Live preview
  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 540;
    const H = 540;
    canvas.width = W;
    canvas.height = H;

    ctx.save();
    ctx.scale(0.5, 0.5);
    selectedTemplate.render(ctx, 1080, 1080, headline || 'Your Headline Here', subtitle || 'Add your subtitle or offer details', cta, business?.name || 'BizzSathi');
    ctx.restore();
  }, [template, headline, subtitle, cta, business?.name]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const handleDownload = async () => {
    setDownloading(true);
    const canvas = canvasRef.current;
    if (!canvas) { setDownloading(false); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { setDownloading(false); return; }

    canvas.width = 1080;
    canvas.height = 1080;
    selectedTemplate.render(ctx, 1080, 1080, headline, subtitle, cta, business?.name || 'BizzSathi');

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bizzsathi-banner-${template}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setDownloading(false);
    }, 'image/png', 1);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleDownload();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;
    selectedTemplate.render(ctx, 1080, 1080, headline, subtitle, cta, business?.name || 'BizzSathi');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'banner.png', { type: 'image/png' });
      try {
        await navigator.share({
          title: headline,
          files: [file],
        });
      } catch {}
    }, 'image/png', 1);
  };

  return (
    <PageWrapper>
      <Header title="Design Banner" onBack={onBack} />
      <div className="px-4 pt-3 pb-32 space-y-5 animate-fade-in">

        {/* Template Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-3 block">
            Choose Template
          </label>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
            {BANNER_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={cn(
                  'flex-shrink-0 w-[100px] rounded-2xl overflow-hidden transition-all',
                  template === t.id ? 'ring-2 ring-accent scale-105' : 'opacity-70'
                )}>
                <div className="h-[100px] relative" style={{ background: t.preview.bg }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <div className="w-6 h-1 rounded-full mb-2" style={{ background: t.preview.accent }} />
                    <div className="w-10 h-1.5 rounded-full mb-1" style={{ background: t.preview.text }} />
                    <div className="w-8 h-1 rounded-full" style={{ background: t.preview.text, opacity: 0.5 }} />
                  </div>
                </div>
                <div className="px-2 py-1.5 bg-neutral-100 dark:bg-white/5">
                  <p className="text-[10px] font-semibold text-neutral-900 dark:text-white text-center truncate">{t.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="glass-card p-3 flex justify-center">
          <canvas ref={previewCanvasRef} className="w-full max-w-[320px] rounded-xl" style={{ aspectRatio: '1/1' }} />
        </div>

        {/* Text Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Headline *
            </label>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Diwali Mega Sale"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Subtitle / Details
            </label>
            <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2}
              placeholder="Up to 50% off on all electronics! Limited time only."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">
              Call to Action (optional)
            </label>
            <input type="text" value={cta} onChange={(e) => setCta(e.target.value)}
              placeholder="e.g., Shop Now, Visit Today, Call Us"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button onClick={handleDownload} disabled={downloading || !headline}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {downloading ? 'Creating...' : 'Download Banner (1080×1080)'}
          </button>

          {'share' in navigator && (
            <button onClick={handleShare} disabled={!headline}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px]
                bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10
                text-neutral-900 dark:text-white active:scale-[0.98] transition-all disabled:opacity-50">
              <Share2 size={18} />
              Share Directly
            </button>
          )}
        </div>

        {/* Hidden full-res canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </PageWrapper>
  );
}

// ========== CREATE POST (caption + share) ==========
function CreatePost({ onBack }: { onBack: () => void }) {
  const { createPost } = useMarketingStore();
  const { business } = useBusinessStore();
  const { language } = useLanguageStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [postType, setPostType] = useState('product_promo');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('professional');
  const [caption, setCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    if (!title) return;
    setGenerating(true);
    const result = await generateCaption(postType, title, details, tone, language, business?.name || '');
    setCaption(result);
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!business?.id || !title) return;
    setSaving(true);
    await createPost({
      business_id: business.id,
      post_type: postType,
      title,
      caption,
      language,
      tone,
      format: 'square',
      status: 'draft',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(onBack, 800);
  };

  const generateImageCard = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) { resolve(null); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      const W = 1080, H = 1080;
      canvas.width = W;
      canvas.height = H;

      const tmpl = BANNER_TEMPLATES[0]; // Use Bold Dark for caption cards
      tmpl.render(ctx, W, H, title, caption.slice(0, 200), '', business?.name || 'BizzSathi');
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
    });
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    const blob = await generateImageCard();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizzsathi-${postType}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(false);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(caption);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    navigator.clipboard.writeText(caption);
    window.open('https://www.facebook.com/', '_blank');
  };

  const shareToInstagram = () => {
    handleDownloadImage();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const blob = await generateImageCard();
        const shareData: any = { title, text: caption };
        if (blob) {
          const file = new File([blob], 'post.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
          }
        }
        await navigator.share(shareData);
      } catch {}
    }
  };

  return (
    <PageWrapper>
      <Header title="Create Post" onBack={onBack} />
      <div className="px-4 pt-3 pb-32 space-y-5 animate-fade-in">
        {/* Post Type */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Post Type</label>
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map((t) => (
              <button key={t.value} onClick={() => setPostType(t.value)}
                className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
                  postType === t.value ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400')}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Product / Offer Name *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Diwali Mega Sale on Electronics"
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Details (optional)</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
            placeholder="Discount %, pricing, features, offer dates..."
            className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Tone</label>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <button key={t.value} onClick={() => setTone(t.value)}
                className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                  tone === t.value ? 'bg-accent text-black' : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400')}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating || !title}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
            bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-[15px]
            shadow-[0_0_25px_rgba(139,92,246,0.25)] active:scale-[0.98] transition-all disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {generating ? 'Generating...' : 'Generate Caption with AI'}
        </button>

        {caption && (
          <div className="space-y-4">
            <div className="premium-card p-5">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" />
                    <p className="text-xs font-semibold text-accent-dark dark:text-accent">AI Generated Caption</p>
                  </div>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400">
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-neutral-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{caption}</p>
                <button onClick={handleGenerate} disabled={generating}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500">
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>

            {/* Share Section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">SHARE TO</p>
              <div className="grid grid-cols-2 gap-2.5">
                <ShareButton icon={<MessageCircle size={16} className="text-emerald-500" />} bg="bg-emerald-500/10" label="WhatsApp" sub="Share caption" onClick={shareToWhatsApp} />
                <ShareButton icon={<FBIcon />} bg="bg-blue-500/10" label="Facebook" sub="Copy & paste" onClick={shareToFacebook} />
                <ShareButton icon={<IGIcon />} bg="bg-pink-500/10" label="Instagram" sub="Download image" onClick={shareToInstagram} />
                {'share' in navigator && (
                  <ShareButton icon={<Share2 size={16} className="text-violet-500" />} bg="bg-violet-500/10" label="More..." sub="Share anywhere" onClick={handleNativeShare} />
                )}
              </div>
            </div>

            <button onClick={handleDownloadImage} disabled={downloading}
              className="w-full glass-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all border border-dashed border-neutral-300 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {downloading ? <Loader2 size={18} className="text-accent animate-spin" /> : <Download size={18} className="text-accent-dark dark:text-accent" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{downloading ? 'Creating image...' : 'Download as Image'}</p>
                <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Branded 1080×1080 card</p>
              </div>
            </button>

            <button onClick={handleSave} disabled={saving}
              className={cn('w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50',
                saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} /> Saved!</> : 'Save Post'}
            </button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </PageWrapper>
  );
}

// ========== FESTIVAL CALENDAR ==========
function FestivalCalendar({ onBack }: { onBack: () => void }) {
  const { festivals, fetchFestivals } = useMarketingStore();
  useEffect(() => { fetchFestivals(); }, []);

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today!';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  return (
    <PageWrapper>
      <Header title="Festival Calendar" onBack={onBack} />
      <div className="px-4 pt-3 pb-24 space-y-3 animate-fade-in">
        <p className="text-sm text-neutral-500 dark:text-zinc-400">Plan your marketing around Indian festivals</p>
        {festivals.map((f) => {
          const daysUntil = getDaysUntil(f.date);
          const isClose = parseInt(daysUntil) <= 7;
          return (
            <div key={f.id} className={cn('glass-card p-4 flex items-center gap-4',
              isClose && 'border-accent/30 bg-accent/5 dark:bg-accent/5')}>
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{new Date(f.date).getDate()}</span>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-500 uppercase">
                  {new Date(f.date).toLocaleString('en', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{f.name}</p>
                {f.description && <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">{f.description}</p>}
                <span className={cn('inline-block mt-1 text-[10px] font-semibold',
                  isClose ? 'text-accent-dark dark:text-accent' : 'text-neutral-400 dark:text-zinc-600')}>
                  {daysUntil}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
}

// ========== SHARED COMPONENTS ==========

function ShareButton({ icon, bg, label, sub, onClick }: { icon: React.ReactNode; bg: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>{icon}</div>
      <div className="text-left">
        <p className="text-xs font-semibold text-neutral-900 dark:text-white">{label}</p>
        <p className="text-[10px] text-neutral-500 dark:text-zinc-500">{sub}</p>
      </div>
    </button>
  );
}

function FBIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IGIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 pt-[env(safe-area-inset-top)] h-[calc(56px+env(safe-area-inset-top))]
      bg-white/80 backdrop-blur-xl border-b border-neutral-200/60
      dark:bg-black/80 dark:border-white/5">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5">
        <ArrowLeft size={20} className="text-neutral-600 dark:text-zinc-400" />
      </button>
      <h1 className="text-[17px] font-bold text-neutral-900 dark:text-white">{title}</h1>
    </div>
  );
}

// ========== CANVAS HELPERS ==========

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function wrapAndDraw(ctx: CanvasRenderingContext2D, text: string, x: number, startY: number, maxWidth: number, lineHeight: number) {
  const lines = wrapText(ctx, text, maxWidth, 0);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBranding(ctx: CanvasRenderingContext2D, W: number, H: number, businessName: string, accentColor: string, mutedColor: string) {
  const barY = H - 90;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, barY, W, 90);
  ctx.font = 'bold 28px "DM Sans", Arial, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.fillText('BizzSathi', 80, barY + 52);
  ctx.font = '22px "DM Sans", Arial, sans-serif';
  ctx.fillStyle = mutedColor;
  const nameWidth = ctx.measureText(businessName).width;
  ctx.fillText(businessName, W - 80 - nameWidth, barY + 52);
}