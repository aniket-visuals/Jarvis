import React, { useEffect, useRef } from 'react';
import { SystemLogEntry, THEME_COLORS, HudState } from '../types';

interface SystemLogProps {
  logs: SystemLogEntry[];
  theme: HudState['themeColor'];
}

export const SystemLog: React.FC<SystemLogProps> = ({ logs, theme }) => {
  const colors = THEME_COLORS[theme];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className={`h-full w-full flex flex-col font-mono text-sm border ${colors.border} bg-black/40 backdrop-blur-sm p-4 rounded-lg overflow-hidden`}>
      <div className={`border-b ${colors.border} pb-2 mb-2 flex justify-between items-center`}>
        <span className={`${colors.primary} font-bold`}>SYSTEM LOGS</span>
        <span className="text-xs text-gray-500">PROTOCOL v2.5</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
            <span className={`shrink-0 ${
              log.type === 'error' ? 'text-red-500 font-bold' :
              log.type === 'success' ? 'text-green-400' :
              log.type === 'warning' ? 'text-amber-400' :
              colors.primary
            }`}>
              {log.type.toUpperCase()}:
            </span>
            <span className="text-gray-300 break-words">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};