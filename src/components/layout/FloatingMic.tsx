import { Mic } from 'lucide-react';

export default function FloatingMic() {
  return (
    <button
      className="fixed z-50 flex items-center justify-center
        w-[60px] h-[60px] rounded-full
        bg-gradient-to-br from-[#c8ee44] to-[#a3c428]
        text-black shadow-glow-mic
        ring-[5px] ring-white dark:ring-[#0a0a0a]
        active:scale-95 transition-transform duration-150
        animate-mic-pulse"
      style={{
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) - 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      aria-label="Voice input"
    >
      <Mic size={24} strokeWidth={2} />
    </button>
  );
}
