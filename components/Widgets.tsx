import React, { useEffect, useState, useRef } from 'react';
import { THEME_COLORS, HudState, ChatMessage } from '../types';

interface WidgetProps {
  theme: HudState['themeColor'];
}

// --- Chat History Widget ---
interface ChatWidgetProps extends WidgetProps {
  messages: ChatMessage[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ theme, messages }) => {
  const colors = THEME_COLORS[theme];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`rounded-2xl border ${colors.border} bg-[#0a0a0a]/80 backdrop-blur-md p-5 flex flex-col h-64 shadow-lg`}>
      <h3 className="text-gray-400 text-sm font-medium mb-4">Chat History</h3>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
           <div className="text-gray-600 text-xs italic mt-10 text-center">No conversation active.</div>
        ) : (
            messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${msg.sender === 'user' ? 'text-gray-500' : colors.primary}`}>
                {msg.sender}
                </span>
                <p className={`text-sm leading-relaxed ${msg.sender === 'user' ? 'text-gray-300' : 'text-white/90'}`}>
                {msg.text}
                </p>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

// Helper for progress bars (moved outside)
const ProgressBar = ({ label, value, max = 100, colorClass, suffix = '%' }: any) => (
  <div className="flex flex-col gap-1 mb-3 last:mb-0">
    <div className="flex justify-between text-xs text-gray-400">
      <span>{label}</span>
      <span>{Math.round(value)}{suffix} {label === 'Disk' ? 'Free' : ''}</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <div 
          className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} 
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      ></div>
    </div>
  </div>
);

// --- System Performance Widget ---
export const SystemPerformanceWidget: React.FC<WidgetProps> = ({ theme }) => {
  const colors = THEME_COLORS[theme];
  const [metrics, setMetrics] = useState({ cpu: 23, memory: 45, disk: 128 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(5, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(20, prev.memory + (Math.random() * 6 - 3))),
        disk: 128 // Static for demo
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`rounded-2xl border ${colors.border} bg-[#0a0a0a]/80 backdrop-blur-md p-5 flex flex-col h-64 shadow-lg`}>
      <h3 className="text-gray-400 text-sm font-medium mb-4">System Performance</h3>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* CPU Graph Visualization */}
        <div className="flex items-end justify-between h-12 gap-1 mb-2 px-1">
             <div className="text-2xl text-white font-light tracking-tighter w-20">CPU: {Math.round(metrics.cpu)}%</div>
             <div className="flex items-end gap-1 h-full flex-1 justify-end">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 rounded-t-sm ${colors.accent} opacity-${i < (metrics.cpu/10) ? '100' : '20'}`}
                        style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                    ></div>
                ))}
             </div>
        </div>

        <div className="space-y-4">
            <ProgressBar label="CPU Load" value={metrics.cpu} colorClass={colors.accent} />
            <ProgressBar label="Memory" value={metrics.memory} colorClass="bg-blue-500" />
            <ProgressBar label="Disk" value={metrics.disk} max={512} suffix=" GB" colorClass="bg-slate-500" />
        </div>
      </div>
    </div>
  );
};

// --- Network Speed Widget ---
export const NetworkSpeedWidget: React.FC<WidgetProps> = ({ theme }) => {
    const colors = THEME_COLORS[theme];
    const [speed, setSpeed] = useState({ up: 92, down: 452 });
  
    useEffect(() => {
      const interval = setInterval(() => {
        setSpeed(prev => ({
          up: Math.floor(prev.up + (Math.random() * 20 - 10)),
          down: Math.floor(prev.down + (Math.random() * 50 - 25))
        }));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
        <div className={`rounded-2xl border ${colors.border} bg-[#0a0a0a]/80 backdrop-blur-md p-5 flex flex-col h-64 shadow-lg`}>
             <h3 className="text-gray-400 text-sm font-medium mb-4">Network Speed</h3>
             
             <div className="flex-1 flex flex-col justify-center gap-6">
                {/* Upload */}
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-gray-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-3xl font-light text-white tracking-tight">{speed.up} <span className="text-sm text-gray-500">Mbps</span></div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Upload</div>
                    </div>
                </div>

                {/* Download */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-gray-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-3xl font-light text-white tracking-tight">{speed.down} <span className="text-sm text-gray-500">Mbps</span></div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Download</div>
                    </div>
                </div>
             </div>
        </div>
    );
};