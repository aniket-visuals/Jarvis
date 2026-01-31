import React from 'react';
import { THEME_COLORS, HudState } from '../types';

interface ArcReactorProps {
  theme: HudState['themeColor'];
  isListening: boolean;
  volume: number; // 0 to 1
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ theme, isListening, volume }) => {
  const colors = THEME_COLORS[theme];
  
  // Calculate glow radius based on volume
  // Volume is usually 0-1, but can peak higher. We map it to a shadow blur radius.
  const glowSize = 20 + (volume * 100); 
  const scale = 1 + (volume * 0.2);

  return (
    <div className={`relative flex flex-col items-center justify-center p-12 rounded-[2rem] border ${colors.border} bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl w-[500px] h-[300px]`}>
      
      {/* Card Title */}
      <h2 className="text-4xl text-white/90 font-light tracking-wide mb-8 text-center">
        {isListening ? "Listening..." : "How can I assist you?"}
      </h2>

      {/* Microphone Visual Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Dynamic Glow Ring */}
        <div 
            className={`absolute rounded-full transition-all duration-75 ease-out ${colors.bg}`}
            style={{ 
                width: '60px', 
                height: '60px', 
                boxShadow: `0 0 ${glowSize}px ${glowSize/2}px var(--tw-shadow-color)`,
                opacity: 0.2 + (volume * 0.5)
            }}
        ></div>

        {/* Microphone Icon Circle */}
        <div 
            className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center transition-transform duration-75`}
            style={{ transform: `scale(${scale})` }}
        >
            <svg 
                className={`w-6 h-6 ${colors.primary} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
            >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
        </div>

        {/* Horizontal Line Indicator */}
        <div className="absolute top-24 w-64 h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        <div 
            className={`absolute top-24 h-[2px] bg-gradient-to-r from-transparent via-${colors.primary.replace('text-', '')} to-transparent transition-all duration-100`}
            style={{ width: `${Math.min(256, volume * 500)}px` }}
        ></div>

      </div>

    </div>
  );
};