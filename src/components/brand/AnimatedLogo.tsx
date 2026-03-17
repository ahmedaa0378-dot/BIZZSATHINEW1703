import { useEffect, useState } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
}

export default function AnimatedLogo({ size = 'md', showText = true, showTagline = true }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const iconSize = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Animated Hex Icon */}
      <div className={`${iconSize} transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="hex-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ECDC4"/>
              <stop offset="50%" stopColor="#c8ee44"/>
              <stop offset="100%" stopColor="#FF8C42"/>
            </linearGradient>
            <linearGradient id="hex-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a2e2a"/>
              <stop offset="100%" stopColor="#1a1a2e"/>
            </linearGradient>
          </defs>

          {/* Hex shape */}
          <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
            fill="url(#hex-bg)" stroke="url(#hex-grad)" strokeWidth="3"/>

          {/* Rupee symbol */}
          <text x="50" y="58" textAnchor="middle" fontSize="32" fontWeight="800"
            fill="url(#hex-grad)" fontFamily="system-ui">₹</text>

          {/* Connection nodes */}
          <circle cx="25" cy="35" r="4" fill="#c8ee44" className="animate-node" style={{ animationDelay: '0.5s' }}/>
          <circle cx="75" cy="35" r="4" fill="#4ECDC4" className="animate-node" style={{ animationDelay: '0.7s' }}/>
          <circle cx="50" cy="20" r="4" fill="#c8ee44" className="animate-node" style={{ animationDelay: '0.6s' }}/>
          <circle cx="25" cy="65" r="4" fill="#4ECDC4" className="animate-node" style={{ animationDelay: '0.8s' }}/>
          <circle cx="75" cy="65" r="4" fill="#FF8C42" className="animate-node" style={{ animationDelay: '0.9s' }}/>
          <circle cx="50" cy="80" r="4" fill="#c8ee44" className="animate-node" style={{ animationDelay: '1.0s' }}/>

          {/* Connection lines */}
          <line x1="25" y1="35" x2="50" y2="20" stroke="#c8ee44" strokeWidth="1.5" opacity="0.6"
            className="animate-line" style={{ animationDelay: '0.8s' }}/>
          <line x1="50" y1="20" x2="75" y2="35" stroke="#4ECDC4" strokeWidth="1.5" opacity="0.6"
            className="animate-line" style={{ animationDelay: '1.0s' }}/>
          <line x1="25" y1="65" x2="50" y2="80" stroke="#4ECDC4" strokeWidth="1.5" opacity="0.6"
            className="animate-line" style={{ animationDelay: '1.2s' }}/>
          <line x1="50" y1="80" x2="75" y2="65" stroke="#FF8C42" strokeWidth="1.5" opacity="0.6"
            className="animate-line" style={{ animationDelay: '1.4s' }}/>
          <line x1="25" y1="35" x2="25" y2="65" stroke="#c8ee44" strokeWidth="1.2" opacity="0.4"
            className="animate-line" style={{ animationDelay: '1.1s' }}/>
          <line x1="75" y1="35" x2="75" y2="65" stroke="#FF8C42" strokeWidth="1.2" opacity="0.4"
            className="animate-line" style={{ animationDelay: '1.3s' }}/>
        </svg>
      </div>

      {/* Brand Name */}
      {showText && (
        <p className={`${textSize} font-extrabold tracking-tight transition-all duration-700 delay-300
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          text-neutral-900 dark:text-white`}>
          Bizz<span className="text-[#8fb02e] dark:text-[#c8ee44]">Sathi</span>
        </p>
      )}

      {/* Tagline */}
      {showTagline && (
        <p className={`text-[11px] font-semibold uppercase tracking-[3px] transition-all duration-700 delay-500
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          text-neutral-400 dark:text-zinc-500`}>
          Your AI Business Partner
        </p>
      )}

      {/* CSS for SVG animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(200,238,68,0.3)); }
          50% { filter: drop-shadow(0 0 22px rgba(200,238,68,0.6)); }
        }
        @keyframes node-pop {
          0% { r: 0; opacity: 0; }
          100% { r: 4; opacity: 1; }
        }
        @keyframes line-draw {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-node {
          animation: node-pop 0.4s ease-out forwards;
          r: 0;
        }
        .animate-line {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: line-draw 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}