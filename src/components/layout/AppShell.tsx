import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Mic, MessageCircle } from 'lucide-react';
import TopHeader from './TopHeader';
import BottomTabBar from './BottomTabBar';
import VoiceOverlay from '../voice/VoiceOverlay';
import ChatOverlay from '../chat/ChatOverlay';

export default function AppShell() {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative
      bg-surface-light dark:bg-surface-dark
      lg:border-x lg:border-neutral-200 lg:dark:border-white/5 lg:shadow-2xl relative">
      <TopHeader />
      <main className="pb-[100px] min-h-[calc(100vh-56px)]">
        <Outlet />
      </main>

      {/* Floating Mic Button */}
      <button
        onClick={() => setVoiceOpen(true)}
        className="fixed z-50 flex items-center justify-center
          w-[60px] h-[60px] rounded-full
          bg-gradient-to-br from-[#c8ee44] to-[#a3c428]
          text-black shadow-[0_4px_30px_rgba(200,238,68,0.4)]
          ring-[5px] ring-surface-light dark:ring-surface-dark
          active:scale-95 transition-transform duration-150
          animate-mic-pulse"
        style={{
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) - 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '430px',
        }}
        aria-label="Voice input"
      >
        <Mic size={24} strokeWidth={2} />
      </button>

      {/* Floating Chat Bubble */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed z-50 flex items-center justify-center
          w-[46px] h-[46px] rounded-full
          bg-gradient-to-br from-accent to-accent-dark
          text-black shadow-glow-green
          active:scale-95 transition-transform duration-150"
        style={{
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 24px)',
          right: 'max(16px, calc((100vw - 430px) / 2 + 16px))',
        }}
        aria-label="AI Chat"
      >
        <MessageCircle size={20} strokeWidth={2} />
      </button>

      <BottomTabBar />

      {/* Overlays */}
      <VoiceOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
