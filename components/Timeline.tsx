import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Session, SessionMode } from '../types';
import { MODE_COLORS } from '../constants';
import { getVirtualDayStart, formatDuration } from '../utils/dateUtils';

interface TimelineProps {
  sessions: Session[];
  activeSession: Session | null;
  currentTime: number;
  lastResetTime: number;
  dayResetTime: string;
  viewMode: 'block' | 'day';
  onToggleViewMode?: () => void;
}

interface TooltipData {
  x: number;
  y: number;
  session: Session;
  isIdle?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  sessions,
  activeSession,
  currentTime,
  lastResetTime,
  dayResetTime,
  viewMode,
  onToggleViewMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const virtualDayStart = useMemo(() => {
    return getVirtualDayStart(currentTime, dayResetTime);
  }, [currentTime, dayResetTime]);

  // Filter and combine sessions reactive to all edits and new additions
  const allSessionsSorted = useMemo(() => {
    const list = sessions
      .filter(s => {
        if (viewMode === 'block') {
          return s.startTime >= lastResetTime;
        }
        return getVirtualDayStart(s.startTime, dayResetTime) === virtualDayStart || s.startTime >= virtualDayStart;
      })
      .map(s => ({
        ...s,
        endTime: s.endTime || (s.duration ? s.startTime + s.duration : undefined),
      }));

    if (activeSession) {
      list.push({ 
        ...activeSession, 
        endTime: currentTime, 
        duration: currentTime - activeSession.startTime 
      });
    }
    return list.sort((a, b) => a.startTime - b.startTime);
  }, [sessions, activeSession, currentTime, viewMode, lastResetTime, virtualDayStart, dayResetTime]);

  // Bounds: Start strictly at the first entry of the day (or block), End at current time (now).
  const bounds = useMemo(() => {
    if (allSessionsSorted.length === 0) {
      const windowSize = 1000 * 60 * 15; // 15-minute placeholder window
      return {
        start: currentTime - windowSize,
        end: currentTime,
        total: windowSize,
        hasData: false,
      };
    }

    const start = allSessionsSorted[0].startTime;
    const end = Math.max(currentTime, start + 1000 * 60); // At least 1 minute

    return {
      start,
      end,
      total: Math.max(end - start, 1000),
      hasData: true,
    };
  }, [allSessionsSorted, currentTime]);

  // Calculate untracked gaps between sessions and from last session to now
  const idleGaps = useMemo(() => {
    if (allSessionsSorted.length === 0) return [];
    const gaps: { start: number; end: number; duration: number }[] = [];

    // Gaps between consecutive sessions
    for (let i = 0; i < allSessionsSorted.length - 1; i++) {
      const currentEnd = allSessionsSorted[i].endTime || (allSessionsSorted[i].startTime + (allSessionsSorted[i].duration || 0));
      const nextStart = allSessionsSorted[i + 1].startTime;
      if (nextStart - currentEnd > 2000) {
        gaps.push({ start: currentEnd, end: nextStart, duration: nextStart - currentEnd });
      }
    }

    // Trailing untracked gap from last completed session to currentTime (when no active session)
    if (!activeSession && allSessionsSorted.length > 0) {
      const lastSession = allSessionsSorted[allSessionsSorted.length - 1];
      const lastEnd = lastSession.endTime || (lastSession.startTime + (lastSession.duration || 0));
      if (currentTime - lastEnd > 2000) {
        gaps.push({ start: lastEnd, end: currentTime, duration: currentTime - lastEnd });
      }
    }

    return gaps;
  }, [allSessionsSorted, activeSession, currentTime]);

  // Aggregate metrics for the span from first entry
  const metrics = useMemo(() => {
    let focus = 0;
    let rest = 0;
    let dist = 0;

    allSessionsSorted.forEach(s => {
      const d = s.duration || ((s.endTime || currentTime) - s.startTime);
      if (s.mode === SessionMode.FOCUSED) focus += d;
      else if (s.mode === SessionMode.REST) rest += d;
      else if (s.mode === SessionMode.DISTRACTED) dist += d;
    });

    const untracked = idleGaps.reduce((acc, g) => acc + g.duration, 0);
    const totalElapsed = bounds.hasData ? bounds.total : 0;

    return { focus, rest, dist, untracked, totalElapsed };
  }, [allSessionsSorted, idleGaps, bounds, currentTime]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains('dark');

    // 1. Draw Untracked Gaps (Void/Idle blocks)
    idleGaps.forEach(gap => {
      const gapStart = Math.max(gap.start, bounds.start);
      const gapEnd = Math.min(gap.end, bounds.end);
      if (gapEnd <= gapStart) return;

      const x = ((gapStart - bounds.start) / bounds.total) * w;
      const width = ((gapEnd - bounds.start) / bounds.total) * w - x;

      if (width > 0) {
        // Subtle hatched / diagonal-striped pattern for untracked void
        ctx.fillStyle = isDark ? 'rgba(39, 39, 42, 0.65)' : 'rgba(228, 228, 231, 0.65)';
        ctx.fillRect(x, 0, width, h);

        // Pattern stripes
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const step = 8;
        for (let sx = x - h; sx < x + width; sx += step) {
          ctx.moveTo(sx, h);
          ctx.lineTo(sx + h, 0);
        }
        ctx.stroke();
      }
    });

    // 2. Draw Tracked Sessions
    allSessionsSorted.forEach(session => {
      const sessionStart = Math.max(session.startTime, bounds.start);
      const sessionEnd = session.endTime || (session.startTime + (session.duration || 0)) || currentTime;
      if (sessionEnd < bounds.start) return;

      const x = ((sessionStart - bounds.start) / bounds.total) * w;
      const width = ((sessionEnd - bounds.start) / bounds.total) * w - x;

      if (width > 0) {
        ctx.fillStyle = MODE_COLORS[session.mode].canvas;
        ctx.fillRect(x, 0, Math.max(2, width), h);

        // Active session animated pulse overlay
        if (!session.endTime || (activeSession && session.id === activeSession.id)) {
          const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + pulse * 0.25})`;
          ctx.fillRect(x, 0, width, h);
        }
      }
    });

    // 3. Time markers / tick lines
    const durationMin = bounds.total / (1000 * 60);
    let interval = 1000 * 60 * 15; // 15 min default
    if (durationMin <= 30) interval = 1000 * 60 * 5; // 5 min
    else if (durationMin > 180) interval = 1000 * 60 * 30; // 30 min
    else if (durationMin > 360) interval = 1000 * 60 * 60; // 60 min

    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    let currentMarker = Math.ceil(bounds.start / interval) * interval;
    while (currentMarker <= bounds.end) {
      const x = ((currentMarker - bounds.start) / bounds.total) * w;
      if (x >= 0 && x <= w) {
        ctx.fillRect(x, 0, 1, h);
      }
      currentMarker += interval;
    }

    // 4. Empty state text if no sessions yet today
    if (allSessionsSorted.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.font = '900 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO SESSIONS TODAY — START FOCUS TO BEGIN TIMELINE', w / 2, h / 2 + 3);
    }
  }, [allSessionsSorted, idleGaps, bounds, currentTime, activeSession]);

  useEffect(() => {
    draw();

    // Only run continuous animation loop if there is an active session pulsing
    if (!activeSession) return;

    let frameId: number;
    function loop() {
      draw();
      frameId = requestAnimationFrame(loop);
    }
    frameId = requestAnimationFrame(loop);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [draw, activeSession, sessions]);

  // Handle window and container resize smoothly
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!bounds) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hoverTime = bounds.start + (x / rect.width) * bounds.total;

    const session = allSessionsSorted.find(
      s => hoverTime >= s.startTime && hoverTime <= (s.endTime || (s.startTime + (s.duration || 0)) || currentTime)
    );
    if (session) {
      setTooltip({ x: e.clientX, y: e.clientY, session });
      return;
    }

    const gap = idleGaps.find(g => hoverTime >= g.start && hoverTime <= g.end);
    if (gap) {
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        session: { 
          id: `untracked-hover-${gap.start}`, 
          mode: SessionMode.IDLE, 
          startTime: gap.start, 
          endTime: gap.end,
          duration: gap.end - gap.start,
        },
        isIdle: true,
      });
      return;
    }
    setTooltip(null);
  };

  const formatClock = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative group space-y-2.5">
      {/* Header Info: Span & Mode Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">
            Daily Flow Progress
          </span>
          {bounds.hasData && (
            <span className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
              {formatClock(bounds.start)} → Now ({formatClock(currentTime)})
            </span>
          )}
        </div>

        {/* Live Tracked vs Untracked Breakdown */}
        {bounds.hasData && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] font-black uppercase tracking-wider">
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Focus {formatDuration(metrics.focus)}
            </span>
            {metrics.rest > 0 && (
              <span className="text-sky-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Rest {formatDuration(metrics.rest)}
              </span>
            )}
            {metrics.dist > 0 && (
              <span className="text-rose-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Distr. {formatDuration(metrics.dist)}
              </span>
            )}
            {metrics.untracked > 0 && (
              <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                Untracked {formatDuration(metrics.untracked)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Canvas Bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-3xl shadow-inner h-14 sm:h-16 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair transition-opacity hover:opacity-90"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
      </div>

      {/* Start / End Time Axis Indicators */}
      {bounds.hasData && (
        <div className="flex justify-between items-center px-2 text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500">
          <span>First Entry: {formatClock(bounds.start)}</span>
          <span className="text-[8px] uppercase tracking-widest font-black">
            Total Span: {formatDuration(bounds.total)}
          </span>
          <span>Now: {formatClock(currentTime)}</span>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed pointer-events-none z-[130] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl rounded-3xl p-4 text-xs flex flex-col gap-3 min-w-[240px] animate-in fade-in zoom-in duration-150 backdrop-blur-xl"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y + 15}px`,
            transform:
              tooltip.x + 260 > window.innerWidth ? 'translateX(-100%) translateX(-30px)' : 'none',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 font-black tracking-widest uppercase text-[9px]">
              <div className={`w-2.5 h-2.5 rounded-full ${MODE_COLORS[tooltip.session.mode].bg}`} />
              <span className={MODE_COLORS[tooltip.session.mode].text}>
                {tooltip.isIdle ? 'Untracked Gap' : tooltip.session.mode}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 uppercase tracking-widest font-black text-[8px]">Time</span>
              <span className="mono font-bold text-zinc-900 dark:text-zinc-200 text-xs">
                {formatClock(tooltip.session.startTime)} –{' '}
                {tooltip.session.endTime ? formatClock(tooltip.session.endTime) : 'Now'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 uppercase tracking-widest font-black text-[8px]">Duration</span>
              <span className="mono font-black text-zinc-900 dark:text-zinc-100 text-xs">
                {formatDuration(tooltip.session.duration || (tooltip.session.endTime || currentTime) - tooltip.session.startTime)}
              </span>
            </div>
          </div>

          {!tooltip.isIdle && (tooltip.session.intent || tooltip.session.reflection) && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              {tooltip.session.intent && (
                <div>
                  <span className="text-emerald-500 uppercase tracking-widest font-black text-[8px]">Mission</span>
                  <p className="text-zinc-800 dark:text-zinc-200 italic font-semibold text-xs leading-snug">
                    "{tooltip.session.intent}"
                  </p>
                </div>
              )}
              {tooltip.session.reflection && (
                <div>
                  <span className="text-rose-500 uppercase tracking-widest font-black text-[8px]">Reflection</span>
                  <p className="text-rose-600 dark:text-rose-400 italic font-medium text-xs leading-snug">
                    "{tooltip.session.reflection}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
