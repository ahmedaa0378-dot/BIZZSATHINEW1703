import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, Sparkles, Loader2, Calendar, Download,
  MessageCircle, Copy, Check, Trash2,
  ChevronRight, X, Wand2, Share2, ExternalLink,
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useMarketingStore, POST_TYPES, TONES, generateCaption } from '../stores/marketingStore';
import { useBusinessStore } from '../stores/appStore';
import { useLanguageStore } from '../stores/languageStore';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';

type View = 'main' | 'create' | 'festivals';

export default function MarketingPage() {
  const [view, setView] = useState<View>('main');
  const navigate = useNavigate();

  return view === 'create' ? (
    <CreatePost onBack={() => setView('main')} />
  ) : view === 'festivals' ? (
    <FestivalCalendar onBack={() => setView('main')} />
  ) : (
    <MainView
      onNavigateBack={() => navigate(-1)}
      onCreate={() => setView('create')}
      onFestivals={() => setView('festivals')}
    />
  );
}

// ========== MAIN VIEW ==========
function MainView({ onNavigateBack, onCreate, onFestivals }: { onNavigateBack: () => void; onCreate: () => void; onFestivals: () => void }) {
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCreate}
            className="premium-card p-4 text-left active:scale-[0.98] transition-all">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                <Wand2 size={18} className="text-accent-dark dark:text-accent" />
              </div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Create Post</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">AI-powered captions</p>
            </div>
          </button>
          <button onClick={onFestivals}
            className="premium-card p-4 text-left active:scale-[0.98] transition-all">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                <Calendar size={18} className="text-violet-500" />
              </div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Festival Calendar</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">{upcomingFestivals.length} upcoming</p>
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

// ========== CREATE POST ==========
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

  // Generate branded image card on canvas
  const generateImageCard = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) { resolve(null); return; }

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      const W = 1080;
      const H = 1080;
      canvas.width = W;
      canvas.height = H;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.5, '#111111');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Accent glow circle (top right)
      const glowGrad = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 300);
      glowGrad.addColorStop(0, 'rgba(200, 238, 68, 0.12)');
      glowGrad.addColorStop(1, 'rgba(200, 238, 68, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);

      // Post type emoji + label
      const pt = POST_TYPES.find((t) => t.value === postType);
      ctx.font = 'bold 42px "DM Sans", sans-serif';
      ctx.fillStyle = '#c8ee44';
      ctx.fillText(`${pt?.emoji || '📝'} ${pt?.label || 'Post'}`, 80, 120);

      // Title
      ctx.font = 'bold 56px "DM Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      const titleLines = wrapText(ctx, title, W - 160, 56);
      let y = 200;
      for (const line of titleLines) {
        ctx.fillText(line, 80, y);
        y += 68;
      }

      // Divider line
      y += 20;
      ctx.strokeStyle = 'rgba(200, 238, 68, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(300, y);
      ctx.stroke();
      y += 40;

      // Caption text
      ctx.font = '36px "DM Sans", sans-serif';
      ctx.fillStyle = '#d4d4d8';
      const captionLines = wrapText(ctx, caption, W - 160, 36);
      const maxLines = Math.min(captionLines.length, 14);
      for (let i = 0; i < maxLines; i++) {
        ctx.fillText(captionLines[i], 80, y);
        y += 48;
      }
      if (captionLines.length > maxLines) {
        ctx.fillText('...', 80, y);
      }

      // Bottom bar
      const barY = H - 100;
      ctx.fillStyle = 'rgba(200, 238, 68, 0.08)';
      ctx.fillRect(0, barY, W, 100);

      // BizzSathi branding
      ctx.font = 'bold 32px "DM Sans", sans-serif';
      ctx.fillStyle = '#c8ee44';
      ctx.fillText('BizzSathi', 80, barY + 58);

      // Business name
      ctx.font = '24px "DM Sans", sans-serif';
      ctx.fillStyle = '#71717a';
      ctx.fillText(business?.name || '', W - 80 - ctx.measureText(business?.name || '').width, barY + 58);

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
    // Facebook doesn't support pre-filled text in share dialog for user posts
    // But we can open compose with copied text
    navigator.clipboard.writeText(caption);
    window.open('https://www.facebook.com/', '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't have web share — user downloads image and posts from app
    handleDownloadImage();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const blob = await generateImageCard();
        const shareData: any = {
          title: title,
          text: caption,
        };
        // Try sharing with image if supported
        if (blob) {
          const file = new File([blob], 'post.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
          }
        }
        await navigator.share(shareData);
      } catch (e) {
        // User cancelled or share failed — ignore
      }
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

        {/* Title */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Product / Offer Name *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Diwali Mega Sale on Electronics"
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
        </div>

        {/* Details */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Details (optional)</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
            placeholder="Discount %, pricing, features, offer dates..."
            className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-[#c8ee44]/50 outline-none" />
        </div>

        {/* Tone */}
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

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={generating || !title}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
            bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-[15px]
            shadow-[0_0_25px_rgba(139,92,246,0.25)] active:scale-[0.98] transition-all disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {generating ? 'Generating...' : 'Generate Caption with AI'}
        </button>

        {/* Caption Result */}
        {caption && (
          <div className="space-y-4">
            {/* Caption Card */}
            <div className="premium-card p-5">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" />
                    <p className="text-xs font-semibold text-accent-dark dark:text-accent">AI Generated Caption</p>
                  </div>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                      bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-zinc-400">
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-neutral-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">{caption}</p>

                {/* Regenerate */}
                <button onClick={handleGenerate} disabled={generating}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-500">
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>

            {/* Share Section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-zinc-600 mb-3">
                SHARE TO
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <button onClick={shareToWhatsApp}
                  className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageCircle size={16} className="text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">WhatsApp</p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Share caption</p>
                  </div>
                </button>

                {/* Facebook */}
                <button onClick={shareToFacebook}
                  className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">Facebook</p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Copy & paste</p>
                  </div>
                </button>

                {/* Instagram */}
                <button onClick={shareToInstagram}
                  className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">Instagram</p>
                    <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Download image</p>
                  </div>
                </button>

                {/* Native Share (mobile) */}
                {'share' in navigator && (
                  <button onClick={handleNativeShare}
                    className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.97] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Share2 size={16} className="text-violet-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white">More...</p>
                      <p className="text-[10px] text-neutral-500 dark:text-zinc-500">Share anywhere</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Download Image Card */}
            <button onClick={handleDownloadImage} disabled={downloading}
              className="w-full glass-card p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all
                border border-dashed border-neutral-300 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {downloading ? <Loader2 size={18} className="text-accent animate-spin" /> :
                  <Download size={18} className="text-accent-dark dark:text-accent" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {downloading ? 'Creating image...' : 'Download as Image'}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-zinc-500">
                  Branded 1080x1080 card — perfect for Instagram, Facebook, WhatsApp
                </p>
              </div>
            </button>

            {/* Save Post */}
            <button onClick={handleSave} disabled={saving}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px]',
                'active:scale-[0.98] transition-all disabled:opacity-50',
                saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
              {saving ? <Loader2 size={18} className="animate-spin" /> :
                saved ? <><Check size={18} /> Saved!</> : 'Save Post'}
            </button>
          </div>
        )}

        {/* Hidden canvas for image generation */}
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
                <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
                  {new Date(f.date).getDate()}
                </span>
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

// ========== HELPERS ==========

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ========== SHARED HEADER ==========
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