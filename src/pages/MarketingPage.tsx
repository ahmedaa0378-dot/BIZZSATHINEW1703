import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Sparkles, Loader2, Calendar, Download,
  Instagram, Facebook, MessageCircle, Copy, Check, Trash2,
  ChevronRight, X, Image, Wand2,
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
              <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5">AI-powered design</p>
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
                  <p className="text-[10px] text-neutral-500 dark:text-zinc-500">{formatDate(new Date(f.date))}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts List */}
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Your Posts</p>
          {posts.length === 0 ? (
            <div className="glass-card p-8 flex flex-col items-center gap-3">
              <Image size={24} className="text-neutral-400 dark:text-zinc-600" />
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">No posts yet</p>
              <p className="text-xs text-neutral-500 dark:text-zinc-500 text-center">Create your first marketing post with AI</p>
              <button onClick={onCreate}
                className="mt-1 px-5 py-2 rounded-xl bg-accent text-black text-xs font-semibold active:scale-95 transition-transform">
                + Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const typeInfo = POST_TYPES.find((t) => t.value === post.post_type);
                return (
                  <div key={post.id} className="glass-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-lg">
                        {typeInfo?.emoji || '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{post.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-zinc-500 mt-0.5 line-clamp-2">{post.caption}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            post.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            post.status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                            'bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-zinc-400')}>
                            {post.status}
                          </span>
                          <span className="text-[10px] text-neutral-400 dark:text-zinc-600">{formatDate(new Date(post.created_at))}</span>
                        </div>
                      </div>
                      <button onClick={() => deletePost(post.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500">
                        <Trash2 size={14} />
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

  const [postType, setPostType] = useState('product_promo');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('professional');
  const [caption, setCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none" />
        </div>

        {/* Details */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-zinc-500 mb-2 block">Details (optional)</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
            placeholder="Discount %, pricing, features, offer dates..."
            className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 outline-none" />
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
        )}

        {/* Save */}
        {caption && (
          <button onClick={handleSave} disabled={saving}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[15px]',
              'active:scale-[0.98] transition-all disabled:opacity-50',
              saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-[#c8ee44] to-[#a3c428] text-black shadow-glow-green')}>
            {saving ? <Loader2 size={18} className="animate-spin" /> :
              saved ? <><Check size={18} /> Saved!</> : <><Download size={18} /> Save Post</>}
          </button>
        )}
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
              {/* Date */}
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
                  {new Date(f.date).getDate()}
                </span>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-zinc-500 uppercase">
                  {new Date(f.date).toLocaleString('en', { month: 'short' })}
                </span>
              </div>

              {/* Info */}
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
