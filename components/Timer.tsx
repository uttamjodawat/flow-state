import React, { useMemo } from 'react';
import { Session } from '../types';
import { MODE_COLORS } from '../constants';

interface TimerProps {
  activeSession: Session | null;
  currentTime: number;
  onEnd: () => void;
  compact?: boolean;
}

const Timer: React.FC<TimerProps> = ({ activeSession, currentTime, compact = false }) => {
  const duration = useMemo(() => {
    if (!activeSession) return 0;
    return Math.max(0, currentTime - activeSession.startTime);
  }, [activeSession, currentTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return {
      h: hours.toString().padStart(2, '0'),
      m: minutes.toString().padStart(2, '0'),
      s: seconds.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(duration);
  const colorClass = activeSession ? MODE_COLORS[activeSession.mode].text : 'text-zinc-300 dark:text-zinc-700';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-full overflow-hidden text-center select-none">
      <div 
        className={`mono font-black tracking-tight tabular-nums transition-all duration-300 flex items-center justify-center gap-[0.04em] ${
          compact 
            ? 'text-[clamp(2.25rem,10vw,4.25rem)] leading-none' 
            : 'text-[clamp(2.75rem,12vw,6.5rem)] leading-none'
        } ${colorClass}`}
      >
        <span>{time.h}</span>
        <span className="opacity-25">:</span>
        <span>{time.m}</span>
        <span className="opacity-25">:</span>
        <span>{time.s}</span>
      </div>

      <div className={`flex flex-col items-center ${compact ? 'mt-1.5 sm:mt-2' : 'mt-2.5 sm:mt-4'}`}>
        <div className="inline-flex items-center gap-1.5">
          {activeSession && (
            <span className={`w-2 h-2 rounded-full animate-ping ${MODE_COLORS[activeSession.mode].bg}`} />
          )}
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-black ${activeSession ? colorClass : 'text-zinc-400 dark:text-zinc-500'}`}>
            {activeSession ? `${activeSession.mode} ACTIVE` : 'READY FOR FLOW'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Timer;