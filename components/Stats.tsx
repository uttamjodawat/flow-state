import React, { useMemo } from 'react';
import { Session, SessionMode } from '../types';
import { MODE_COLORS } from '../constants';
import { Coffee, Zap, AlertCircle, Ghost } from 'lucide-react';
import { formatDuration } from '../utils/dateUtils';

interface StatsProps {
  sessions: Session[];
  title?: string;
}

const Stats: React.FC<StatsProps> = ({ sessions, title }) => {
  const modeStats = useMemo(() => {
    const modes = [SessionMode.FOCUSED, SessionMode.REST, SessionMode.DISTRACTED];

    // Logged Sessions Stats
    const logged = modes.map(mode => {
      const modeSessions = sessions.filter(s => s.mode === mode && s.duration);
      const durations = modeSessions.map(s => s.duration as number);

      const count = modeSessions.length;
      const total = durations.reduce((a, b) => a + b, 0);
      const min = durations.length ? Math.min(...durations) : 0;
      const max = durations.length ? Math.max(...durations) : 0;
      const avg = durations.length ? total / count : 0;

      return { mode, count, total, min, max, avg, type: 'logged' };
    });

    // Calculate Unlogged (Idle / Void) Time
    let idleTotal = 0;
    let idleCount = 0;
    if (sessions.length > 0) {
      const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
      const dayStart = sorted[0].startTime;
      const now = Date.now();
      const totalLoggedDuration = sessions.reduce(
        (acc, s) => acc + (s.duration || (now - s.startTime)),
        0
      );
      idleTotal = Math.max(0, now - dayStart - totalLoggedDuration);

      // Count gaps between consecutive sessions
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentEnd = sorted[i].endTime || sorted[i].startTime;
        const nextStart = sorted[i + 1].startTime;
        if (nextStart - currentEnd > 2000) idleCount++;
      }
    }

    const idleStat = {
      mode: SessionMode.IDLE,
      count: idleCount,
      total: idleTotal,
      min: 0,
      max: 0,
      avg: 0,
      type: 'unlogged',
    };

    return [...logged, idleStat];
  }, [sessions]);

  const getIcon = (mode: SessionMode) => {
    switch (mode) {
      case SessionMode.FOCUSED:
        return <Zap size={14} />;
      case SessionMode.REST:
        return <Coffee size={14} />;
      case SessionMode.DISTRACTED:
        return <AlertCircle size={14} />;
      default:
        return <Ghost size={14} />;
    }
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {title}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modeStats.map(stat => (
          <div
            key={stat.mode}
            className={`p-6 rounded-[2.5rem] border ${MODE_COLORS[stat.mode].border} bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className={`font-black tracking-widest text-[9px] uppercase px-3 py-1.5 rounded-full ${MODE_COLORS[stat.mode].bg} text-white flex items-center gap-1.5`}
              >
                {getIcon(stat.mode)}
                {stat.mode === SessionMode.IDLE ? 'Unlogged Void' : stat.mode}
              </h3>
              <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-600">
                <span className="text-[10px] font-bold uppercase tracking-wider">{stat.count} {stat.count === 1 ? 'Block' : 'Blocks'}</span>
              </div>
            </div>

            <div className="space-y-1 mb-5">
              <span className="text-[9px] uppercase tracking-widest font-black text-zinc-400">Total Duration</span>
              <p className="text-3xl font-black mono text-zinc-900 dark:text-white tracking-tighter">
                {formatDuration(stat.total)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
              <div>
                <span className="text-zinc-400 uppercase tracking-widest text-[8px] font-black block">Min</span>
                <span className="mono font-bold text-zinc-700 dark:text-zinc-300">{formatDuration(stat.min, true)}</span>
              </div>
              <div>
                <span className="text-zinc-400 uppercase tracking-widest text-[8px] font-black block">Avg</span>
                <span className="mono font-bold text-zinc-700 dark:text-zinc-300">{formatDuration(stat.avg, true)}</span>
              </div>
              <div>
                <span className="text-zinc-400 uppercase tracking-widest text-[8px] font-black block">Max</span>
                <span className="mono font-bold text-zinc-700 dark:text-zinc-300">{formatDuration(stat.max, true)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
