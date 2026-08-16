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
    <div className="flex flex-col items-center justify-center w-full max-w-full overflow-hidden text-center">
      <div className={`mono text-[clamp(2rem,15vw,10rem)] leading-none font-black tracking-tighter ${colorClass} tabular-nums transition-colors duration-500 select-none flex items-center justify-center gap-[0.05em]`}>
        <span>{time.h}</span>
        <span className="opacity-20">:</span>
        <span>{time.m}</span>
        <span className="opacity-20">:</span>
        <span>{time.s}</span>
      </div>
      <div className="mt-4 sm:mt-8 flex flex-col items-center">
        <span className={`text-[10px] sm:text-xs uppercase tracking-[0.4em] font-black ${activeSession ? colorClass : 'text-zinc-400 dark:text-zinc-500'}`}>
          {activeSession ? `${activeSession.mode} MODE` : 'READY FOR FLOW'}
        </span>
        {!activeSession && (
          <p className="text-zinc-400 dark:text-zinc-500 mt-2 text-[10px] sm:text-xs font-medium max-w-[200px] leading-relaxed">
            Declare your mission above to begin.
          </p>
        )}
      </div>
    </div>
  );
};

export default Timer;