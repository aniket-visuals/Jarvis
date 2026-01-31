export interface SystemLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  isPartial?: boolean;
}

export interface HudState {
  isListening: boolean;
  isConnected: boolean;
  themeColor: 'cyan' | 'amber' | 'red' | 'green';
  isDiagnosticRunning: boolean;
  isSystemLocked: boolean;
}

// Extend Window interface for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    process: {
        env: {
            API_KEY?: string;
        }
    }
  }
}

// Map color names to Tailwind classes
export const THEME_COLORS = {
  cyan: {
    primary: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/30',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    accent: 'bg-cyan-400',
    hex: '#22d3ee'
  },
  amber: {
    primary: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/30',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    accent: 'bg-amber-400',
    hex: '#fbbf24'
  },
  red: {
    primary: 'text-red-500',
    border: 'border-red-600/30',
    bg: 'bg-red-950/30',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
    accent: 'bg-red-500',
    hex: '#ef4444'
  },
  green: {
    primary: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/30',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    accent: 'bg-emerald-400',
    hex: '#34d399'
  }
};