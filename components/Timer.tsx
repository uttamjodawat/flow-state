import React, { useMemo } from 'react';
import { Session } from '../types';
import { MODE_COLORS } from '../constants';

interface TimerProps {
  activeSession: Session | null;
  currentTime: number;
  onEnd: () => void;
}

const Timer: React.FC<TimerProps> = ({ activeSession, currentTime }) => {
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
    <div className="flex flex-col items-center justify-center w-full max-w-full overflow-hidden text-center select-none py-2 sm:py-4">
      <div 
        className={`mono font-black tracking-tighter tabular-nums transition-all duration-300 flex items-center justify-center gap-[0.03em] text-[clamp(3.5rem,13vw,8.5rem)] leading-none ${colorClass}`}
      >
        <span>{time.h}</span>
        <span className="opacity-25">:</span>
        <span>{time.m}</span>
        <span className="opacity-25">:</span>
        <span>{time.s}</span>
      </div>

      <div className="flex flex-col items-center mt-3 sm:mt-5">
        <div className="inline-flex items-center gap-2">
          {activeSession && (
            <span className={`w-2.5 h-2.5 rounded-full animate-ping ${MODE_COLORS[activeSession.mode].bg}`} />
          )}
          <span className={`text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black ${activeSession ? colorClass : 'text-zinc-400 dark:text-zinc-500'}`}>
            {activeSession ? `${activeSession.mode} ACTIVE` : 'READY FOR FLOW'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Timer;