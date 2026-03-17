import { MessageCircle } from 'lucide-react';

export default function FloatingChat() {
  return (
    <button
      className="fixed z-50 flex items-center justify-center
        w-[46px] h-[46px] rounded-full
        bg-gradient-to-br from-accent to-accent-dark
        text-black shadow-glow-green
        active:scale-95 transition-transform duration-150"
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)',
        right: '16px',
      }}
      aria-label="AI Chat"
    >
      <MessageCircle size={20} strokeWidth={2} />
    </button>
  );
}
