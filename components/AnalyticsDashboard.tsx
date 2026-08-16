import React, { useState, useMemo } from 'react';
import { Session, SessionMode } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Flame, 
  Brain, 
  Zap, 
  Coffee, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Target, 
  Waves, 
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  getVirtualDayStart, 
  formatDuration, 
  formatVirtualDayKey, 
  parseResetTime 
} from '../utils/dateUtils';
import { MODE_COLORS } from '../constants';
import Stats from './Stats';

interface AnalyticsDashboardProps {
  sessions: Session[];
  dayResetTime: string;
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'insights';

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  sessions,
  dayResetTime,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // 0 = current virtual day, -1 = yesterday, etc.

  // Target timestamp for day view
  const targetDayTimestamp = useMemo(() => {
    const now = Date.now();
    return now + selectedDayOffset * 24 * 60 * 60 * 1000;
  }, [selectedDayOffset]);

  const targetDayStart = useMemo(() => {
    return getVirtualDayStart(targetDayTimestamp, dayResetTime);
  }, [targetDayTimestamp, dayResetTime]);

  const targetDayEnd = useMemo(() => {
    return targetDayStart + 24 * 60 * 60 * 1000;
  }, [targetDayStart]);

  // Current virtual day formatted label
  const dayDisplayLabel = useMemo(() => {
    if (selectedDayOffset === 0) return 'Today';
    if (selectedDayOffset === -1) return 'Yesterday';
    return formatVirtualDayKey(targetDayTimestamp, dayResetTime);
  }, [selectedDayOffset, targetDayTimestamp, dayResetTime]);

  // 1. Daily Analytics Data
  const dailyMetrics = useMemo(() => {
    const daySessions = sessions.filter(
      s => s.startTime >= targetDayStart && s.startTime < targetDayEnd && s.duration
    );

    const focus = daySessions.filter(s => s.mode === SessionMode.FOCUSED);
    const rest = daySessions.filter(s => s.mode === SessionMode.REST);
    const distracted = daySessions.filter(s => s.mode === SessionMode.DISTRACTED);

    const focusDuration = focus.reduce((acc, s) => acc + (s.duration || 0), 0);
    const restDuration = rest.reduce((acc, s) => acc + (s.duration || 0), 0);
    const distractedDuration = distracted.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalLogged = focusDuration + restDuration + distractedDuration;

    const efficiency = totalLogged > 0 ? (focusDuration / totalLogged) * 100 : 0;

    // Depth calculation
    const shallow = focus.filter(s => (s.duration || 0) < 15 * 60 * 1000).length;
    const flow = focus.filter(s => (s.duration || 0) >= 15 * 60 * 1000 && (s.duration || 0) < 45 * 60 * 1000).length;
    const deep = focus.filter(s => (s.duration || 0) >= 45 * 60 * 1000).length;

    // Hourly buckets (0 to 23)
    const { hours: resetHour } = parseResetTime(dayResetTime);
    const hourlyData: { hourLabel: string; hour: number; Focus: number; Rest: number; Distracted: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const h = (resetHour + i) % 24;
      const hourStart = targetDayStart + i * 3600 * 1000;
      const hourEnd = hourStart + 3600 * 1000;

      const inHour = daySessions.filter(s => s.startTime >= hourStart && s.startTime < hourEnd);
      const hFocus = inHour.filter(s => s.mode === SessionMode.FOCUSED).reduce((a, s) => a + (s.duration || 0), 0) / (60 * 1000);
      const hRest = inHour.filter(s => s.mode === SessionMode.REST).reduce((a, s) => a + (s.duration || 0), 0) / (60 * 1000);
      const hDist = inHour.filter(s => s.mode === SessionMode.DISTRACTED).reduce((a, s) => a + (s.duration || 0), 0) / (60 * 1000);

      const hourLabel = `${h.toString().padStart(2, '0')}:00`;
      hourlyData.push({
        hourLabel,
        hour: h,
        Focus: Math.round(hFocus),
        Rest: Math.round(hRest),
        Distracted: Math.round(hDist),
      });
    }

    // Top missions for the day
    const missionMap: Record<string, number> = {};
    focus.forEach(s => {
      const title = s.intent?.trim() || 'General Deep Work';
      missionMap[title] = (missionMap[title] || 0) + (s.duration || 0);
    });
    const topMissions = Object.entries(missionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, duration]) => ({ name, duration }));

    return {
      sessionCount: daySessions.length,
      focusDuration,
      restDuration,
      distractedDuration,
      totalLogged,
      efficiency,
      shallow,
      flow,
      deep,
      hourlyData,
      topMissions,
    };
  }, [sessions, targetDayStart, targetDayEnd, dayResetTime]);

  // 2. Weekly Analytics Data (Past 7 virtual days)
  const weeklyMetrics = useMemo(() => {
    const days = [];
    const now = Date.now();
    let totalWeeklyFocus = 0;
    let totalWeeklyRest = 0;
    let totalWeeklyDist = 0;
    let bestDay = { label: 'None', focus: 0 };

    for (let i = 6; i >= 0; i--) {
      const dTimestamp = now - i * 24 * 60 * 60 * 1000;
      const dStart = getVirtualDayStart(dTimestamp, dayResetTime);
      const dEnd = dStart + 24 * 60 * 60 * 1000;
      const dayDate = new Date(dStart);
      const label = dayDate.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });

      const dSessions = sessions.filter(s => s.startTime >= dStart && s.startTime < dEnd && s.duration);
      const focusMs = dSessions.filter(s => s.mode === SessionMode.FOCUSED).reduce((a, s) => a + (s.duration || 0), 0);
      const restMs = dSessions.filter(s => s.mode === SessionMode.REST).reduce((a, s) => a + (s.duration || 0), 0);
      const distMs = dSessions.filter(s => s.mode === SessionMode.DISTRACTED).reduce((a, s) => a + (s.duration || 0), 0);

      totalWeeklyFocus += focusMs;
      totalWeeklyRest += restMs;
      totalWeeklyDist += distMs;

      const focusHours = Number((focusMs / (3600 * 1000)).toFixed(2));
      const restHours = Number((restMs / (3600 * 1000)).toFixed(2));
      const distHours = Number((distMs / (3600 * 1000)).toFixed(2));

      if (focusMs > bestDay.focus) {
        bestDay = { label, focus: focusMs };
      }

      days.push({
        label,
        focusHours,
        restHours,
        distHours,
        focusMs,
        sessionCount: dSessions.length,
      });
    }

    const avgDailyFocus = totalWeeklyFocus / 7;

    return {
      days,
      totalWeeklyFocus,
      totalWeeklyRest,
      totalWeeklyDist,
      avgDailyFocus,
      bestDay,
    };
  }, [sessions, dayResetTime]);

  // 3. Monthly Analytics Data (Past 30 virtual days)
  const monthlyMetrics = useMemo(() => {
    const days = [];
    const now = Date.now();
    let totalMonthlyFocus = 0;
    let activeDaysCount = 0;

    for (let i = 29; i >= 0; i--) {
      const dTimestamp = now - i * 24 * 60 * 60 * 1000;
      const dStart = getVirtualDayStart(dTimestamp, dayResetTime);
      const dEnd = dStart + 24 * 60 * 60 * 1000;
      const dDate = new Date(dStart);
      const label = dDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const dSessions = sessions.filter(s => s.startTime >= dStart && s.startTime < dEnd && s.duration);
      const focusMs = dSessions.filter(s => s.mode === SessionMode.FOCUSED).reduce((a, s) => a + (s.duration || 0), 0);

      if (focusMs > 0) activeDaysCount++;
      totalMonthlyFocus += focusMs;

      const focusHours = Number((focusMs / (3600 * 1000)).toFixed(1));

      days.push({
        label,
        dateKey: formatVirtualDayKey(dTimestamp, dayResetTime),
        focusHours,
        focusMs,
        sessionCount: dSessions.length,
      });
    }

    const consistencyRate = Math.round((activeDaysCount / 30) * 100);
    const avgDailyFocus = totalMonthlyFocus / 30;

    return {
      days,
      totalMonthlyFocus,
      activeDaysCount,
      consistencyRate,
      avgDailyFocus,
    };
  }, [sessions, dayResetTime]);

  // 4. Cognitive DNA & Comprehensive Insights
  const insightsMetrics = useMemo(() => {
    if (sessions.length === 0) return null;

    const focusSessions = sessions.filter(s => s.mode === SessionMode.FOCUSED && s.duration);
    const distractedSessions = sessions.filter(s => s.mode === SessionMode.DISTRACTED && s.duration);
    const restSessions = sessions.filter(s => s.mode === SessionMode.REST && s.duration);

    // Flow Depth
    const shallow = focusSessions.filter(s => (s.duration || 0) < 15 * 60 * 1000).length;
    const flow = focusSessions.filter(s => (s.duration || 0) >= 15 * 60 * 1000 && (s.duration || 0) < 45 * 60 * 1000).length;
    const deep = focusSessions.filter(s => (s.duration || 0) >= 45 * 60 * 1000).length;
    const totalFocus = focusSessions.length || 1;

    // Resilience (Bounce back after distraction within 15 min)
    let bounceBacks = 0;
    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].mode === SessionMode.DISTRACTED && sorted[i + 1].mode === SessionMode.FOCUSED) {
        const gap = sorted[i + 1].startTime - (sorted[i].endTime || sorted[i].startTime);
        if (gap < 15 * 60 * 1000) bounceBacks++;
      }
    }
    const resilienceScore = distractedSessions.length > 0 ? (bounceBacks / distractedSessions.length) * 100 : 100;

    // Temporal Peak Window
    const buckets: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    focusSessions.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      if (hour >= 5 && hour < 12) buckets.Morning += s.duration || 0;
      else if (hour >= 12 && hour < 17) buckets.Afternoon += s.duration || 0;
      else if (hour >= 17 && hour < 22) buckets.Evening += s.duration || 0;
      else buckets.Night += s.duration || 0;
    });
    const peakWindow = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];

    // Recovery Ratio
    const totalFocusMs = focusSessions.reduce((a, s) => a + (s.duration || 0), 0);
    const totalRestMs = restSessions.reduce((a, s) => a + (s.duration || 0), 0);
    const recoveryRatio = totalFocusMs > 0 ? (totalRestMs / totalFocusMs) * 100 : 0;

    // Archetype
    let archetype = 'The Flow Architect';
    let archetypeDesc = 'You structure your workday with deep endurance and consistent focus blocks.';

    if (deep > flow && deep > shallow) {
      archetype = 'The Deep Diver';
      archetypeDesc = 'You consistently push beyond 45-minute focus intervals, unlocking peak neuroplasticity.';
    } else if (resilienceScore > 75 && distractedSessions.length > 2) {
      archetype = 'The Unstoppable';
      archetypeDesc = 'Interruptions happen, but you recover rapidly and protect your momentum.';
    } else if (recoveryRatio < 10 && totalFocusMs > 3 * 3600 * 1000) {
      archetype = 'The Sprint Burner';
      archetypeDesc = 'High output intensity. Remember to schedule proactive rest to maintain longevity.';
    } else if (shallow > deep && shallow > flow) {
      archetype = 'The Micro-Sprinter';
      archetypeDesc = 'You excel in rapid execution bursts. Try extending blocks to 30m+ for complex synthesis.';
    }

    // Distraction tag frequency
    const distractionReasonMap: Record<string, number> = {};
    distractedSessions.forEach(s => {
      if (s.reflection) {
        const text = s.reflection.trim();
        distractionReasonMap[text] = (distractionReasonMap[text] || 0) + 1;
      }
    });
    const topDistractions = Object.entries(distractionReasonMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Unique days streak
    const uniqueDays = new Set(sessions.map(s => formatVirtualDayKey(s.startTime, dayResetTime)));

    return {
      archetype,
      archetypeDesc,
      depthPercent: {
        deep: Math.round((deep / totalFocus) * 100),
        flow: Math.round((flow / totalFocus) * 100),
        shallow: Math.round((shallow / totalFocus) * 100),
      },
      resilienceScore: Math.round(resilienceScore),
      peakWindow,
      recoveryRatio: Math.round(recoveryRatio),
      streak: uniqueDays.size,
      totalFocusMs,
      totalRestMs,
      topDistractions,
    };
  }, [sessions, dayResetTime]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50 dark:bg-zinc-900/70 p-2.5 sm:p-3 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
        
        {/* Timeframe Switcher Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'daily', label: 'Daily', icon: Clock },
            { id: 'weekly', label: 'Weekly', icon: BarChart3 },
            { id: 'monthly', label: 'Monthly', icon: Calendar },
            { id: 'insights', label: 'Insights', icon: Brain },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = timeframe === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id as Timeframe)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-[1.02]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Day Navigation Controls when in Daily View */}
        {timeframe === 'daily' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setSelectedDayOffset(prev => prev - 1)}
              className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center px-2">
              <span className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider block">
                {dayDisplayLabel}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">
                {formatVirtualDayKey(targetDayTimestamp, dayResetTime)}
              </span>
            </div>
            <button
              onClick={() => setSelectedDayOffset(prev => Math.min(0, prev + 1))}
              disabled={selectedDayOffset >= 0}
              className={`p-2 rounded-xl border transition-colors ${
                selectedDayOffset >= 0
                  ? 'opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
            {selectedDayOffset !== 0 && (
              <button
                onClick={() => setSelectedDayOffset(0)}
                className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        )}

      </div>

      {/* 1. DAILY VIEW */}
      {timeframe === 'daily' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Daily Quick Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-emerald-500/20 shadow-sm">
              <div className="flex items-center justify-between text-emerald-500 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest">Deep Focus</span>
                <Zap size={16} />
              </div>
              <p className="text-3xl font-black mono text-zinc-900 dark:text-white tracking-tighter">
                {formatDuration(dailyMetrics.focusDuration)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                {dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow} Focus Blocks
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-sky-500/20 shadow-sm">
              <div className="flex items-center justify-between text-sky-500 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest">Rest & Recharge</span>
                <Coffee size={16} />
              </div>
              <p className="text-3xl font-black mono text-zinc-900 dark:text-white tracking-tighter">
                {formatDuration(dailyMetrics.restDuration)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                Sustained Recovery Time
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-rose-500/20 shadow-sm">
              <div className="flex items-center justify-between text-rose-500 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest">Distractions</span>
                <AlertCircle size={16} />
              </div>
              <p className="text-3xl font-black mono text-zinc-900 dark:text-white tracking-tighter">
                {formatDuration(dailyMetrics.distractedDuration)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                Interrupted Flow Intervals
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest">Flow Efficiency</span>
                <Target size={16} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-black mono text-emerald-500 tracking-tighter">
                {Math.round(dailyMetrics.efficiency)}%
              </p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                Focus vs Total Logged Ratio
              </p>
            </div>
          </div>

          {/* Hourly Bar Distribution Chart */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  Hourly Flow Pulse
                </h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mt-0.5">
                  Minutes logged per hour (Day reset at {dayResetTime})
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyMetrics.hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="hourLabel" tick={{ fontSize: 10, fill: '#71717a' }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} unit="m" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderRadius: '1rem', 
                      border: '1px solid #27272a',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Bar dataKey="Focus" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Rest" fill="#0ea5e9" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Distracted" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flow Depth Distribution & Top Missions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Depth Mastery */}
            <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                    Flow Depth Mastery
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                    Session Duration Segmentation
                  </p>
                </div>
                <Waves className="text-emerald-500" size={18} />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">Deep Work (≥45m)</span>
                    <span className="mono">{dailyMetrics.deep} sessions</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow > 0 ? (dailyMetrics.deep / (dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-700 dark:text-emerald-500">Solid Flow (15–45m)</span>
                    <span className="mono">{dailyMetrics.flow} sessions</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow > 0 ? (dailyMetrics.flow / (dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-800 dark:text-emerald-600">Quick Sprint (&lt;15m)</span>
                    <span className="mono">{dailyMetrics.shallow} sessions</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-800 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow > 0 ? (dailyMetrics.shallow / (dailyMetrics.deep + dailyMetrics.flow + dailyMetrics.shallow)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Mission Intents */}
            <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                    Primary Missions
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                    Focus Time Allocation
                  </p>
                </div>
                <Target className="text-emerald-500" size={18} />
              </div>

              {dailyMetrics.topMissions.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-6 text-center">
                  No named missions logged for this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {dailyMetrics.topMissions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatDuration(item.duration, true)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Mode Stats & Void Breakdown */}
          <div className="pt-2">
            <Stats 
              sessions={sessions.filter(s => s.startTime >= targetDayStart && s.startTime < targetDayEnd)} 
              title="Session Dynamics & Void Breakdown" 
            />
          </div>

        </div>
      )}

      {/* 2. WEEKLY VIEW */}
      {timeframe === 'weekly' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Weekly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Total Focus (7 Days)</p>
              <p className="text-3xl font-black mono text-emerald-500 mt-2 tracking-tighter">
                {formatDuration(weeklyMetrics.totalWeeklyFocus, true)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                Avg: {formatDuration(weeklyMetrics.avgDailyFocus, true)} / day
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Peak Performance Day</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2 tracking-tight">
                {weeklyMetrics.bestDay.label}
              </p>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold mono">
                {formatDuration(weeklyMetrics.bestDay.focus, true)} logged
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Rest & Distraction Balance</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <span className="text-xs text-sky-500 font-bold block">Rest</span>
                  <span className="text-xl font-black mono text-zinc-900 dark:text-white">
                    {formatDuration(weeklyMetrics.totalWeeklyRest, true)}
                  </span>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div>
                  <span className="text-xs text-rose-500 font-bold block">Distraction</span>
                  <span className="text-xl font-black mono text-zinc-900 dark:text-white">
                    {formatDuration(weeklyMetrics.totalWeeklyDist, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  7-Day Flow Comparison
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  Hours logged per day across Focus, Rest, and Distraction
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyMetrics.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} unit="h" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderRadius: '1rem', 
                      border: '1px solid #27272a',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Bar dataKey="focusHours" name="Focus (h)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="restHours" name="Rest (h)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="distHours" name="Distracted (h)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* 3. MONTHLY VIEW */}
      {timeframe === 'monthly' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Monthly KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Total Monthly Focus</p>
              <p className="text-3xl font-black mono text-emerald-500 mt-2 tracking-tighter">
                {formatDuration(monthlyMetrics.totalMonthlyFocus, true)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                Across 30 days
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Consistency Score</p>
              <p className="text-3xl font-black mono text-sky-500 mt-2 tracking-tighter">
                {monthlyMetrics.consistencyRate}%
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                {monthlyMetrics.activeDaysCount} of 30 days active
              </p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Daily Focus Velocity</p>
              <p className="text-3xl font-black mono text-zinc-900 dark:text-white mt-2 tracking-tighter">
                {formatDuration(monthlyMetrics.avgDailyFocus, true)}
              </p>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                Average daily output
              </p>
            </div>
          </div>

          {/* 30-Day Trend Area Chart */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                30-Day Flow Velocity Trend
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                Daily Focus Hours over the past month
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyMetrics.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#71717a' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#71717a' }} unit="h" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderRadius: '1rem', 
                      border: '1px solid #27272a',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Area type="monotone" dataKey="focusHours" name="Focus (Hours)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#focusGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 30-Day Activity Heatmap Grid */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                Monthly Heat Grid
              </h3>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400">
                <span>Low</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-zinc-100 dark:bg-zinc-800" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>High</span>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 pt-2">
              {monthlyMetrics.days.map((day, idx) => {
                let color = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';
                if (day.focusHours > 4) color = 'bg-emerald-500 text-white font-black shadow-sm';
                else if (day.focusHours > 2) color = 'bg-emerald-500/70 text-white font-bold';
                else if (day.focusHours > 0.5) color = 'bg-emerald-500/35 text-zinc-800 dark:text-zinc-200';
                else if (day.focusHours > 0) color = 'bg-emerald-500/15 text-zinc-700 dark:text-zinc-300';

                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl text-center border border-zinc-200/50 dark:border-zinc-700/40 flex flex-col justify-between h-16 ${color}`}
                    title={`${day.dateKey}: ${day.focusHours}h focus`}
                  >
                    <span className="text-[8px] uppercase tracking-tighter opacity-80 block truncate">
                      {day.label}
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {day.focusHours > 0 ? `${day.focusHours}h` : '–'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 4. COGNITIVE DNA & ALL-TIME INSIGHTS */}
      {timeframe === 'insights' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {!insightsMetrics ? (
            <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <Brain className="mx-auto text-zinc-300 mb-3" size={40} />
              <p className="text-xs text-zinc-400 italic">Log more sessions to generate deep behavioral insights.</p>
            </div>
          ) : (
            <>
              {/* Archetype Hero Card */}
              <div className="p-8 sm:p-10 rounded-[3rem] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      <ShieldCheck size={12} /> Verified Behavioral Archetype
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
                      {insightsMetrics.archetype}
                    </h3>
                    <p className="text-zinc-400 dark:text-zinc-600 text-sm leading-relaxed font-medium">
                      {insightsMetrics.archetypeDesc}
                    </p>
                    <div className="flex gap-6 pt-4 border-t border-white/10 dark:border-zinc-200">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50 block mb-1">Peak Rhythm</span>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {insightsMetrics.peakWindow === 'Morning' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-sky-400" />}
                          {insightsMetrics.peakWindow}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50 block mb-1">Flow Days Streak</span>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-orange-400">
                          <Flame size={14} />
                          {insightsMetrics.streak} Days
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flow Depth Bar */}
                  <div className="space-y-6 bg-white/5 dark:bg-zinc-50 p-6 sm:p-8 rounded-[2rem] border border-white/5 dark:border-zinc-200">
                    <div>
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 opacity-80">
                        <span>Depth Breakdown</span>
                        <span>{insightsMetrics.depthPercent.deep}% Deep</span>
                      </div>
                      <div className="h-4 w-full bg-white/10 dark:bg-zinc-200 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-400" style={{ width: `${insightsMetrics.depthPercent.deep}%` }} title="Deep" />
                        <div className="h-full bg-emerald-600" style={{ width: `${insightsMetrics.depthPercent.flow}%` }} title="Flow" />
                        <div className="h-full bg-emerald-800" style={{ width: `${insightsMetrics.depthPercent.shallow}%` }} title="Shallow" />
                      </div>
                      <div className="flex justify-between text-[8px] font-bold uppercase opacity-60 mt-1.5">
                        <span>Deep (45m+)</span>
                        <span>Shallow (&lt;15m)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Resilience</span>
                        <p className="text-2xl font-black text-emerald-400 dark:text-emerald-600">{insightsMetrics.resilienceScore}%</p>
                        <p className="text-[8px] opacity-60">Bounce-back speed</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Recovery</span>
                        <p className="text-2xl font-black text-sky-400 dark:text-sky-600">{insightsMetrics.recoveryRatio}%</p>
                        <p className="text-[8px] opacity-60">Rest vs Effort balance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights Triplet Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Depth Mastery</h4>
                    <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                      {insightsMetrics.depthPercent.deep > 35 ? 'Elite Deep Worker' : 'Developing Depth'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">
                      You achieve 45m+ unbroken focus in <strong className="text-emerald-500">{insightsMetrics.depthPercent.deep}%</strong> of sessions.
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Distraction Recovery</h4>
                    <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                      {insightsMetrics.resilienceScore > 75 ? 'High Momentum' : 'Vulnerable to Drift'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">
                      {insightsMetrics.resilienceScore > 75 
                        ? 'You bounce right back to focused flow within 15 minutes after distraction.'
                        : 'Consider logging immediate reflections to isolate distraction triggers.'}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Burnout Shield</h4>
                    <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                      {insightsMetrics.recoveryRatio >= 15 ? 'Balanced & Sustainable' : 'Low Recovery Guard'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">
                      Rest time sits at <strong className="text-sky-500">{insightsMetrics.recoveryRatio}%</strong> of focus output.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default AnalyticsDashboard;
