import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Session, SessionMode, Theme, ActiveTab } from './types';
import { 
  SESSION_STORAGE_KEY, 
  THEME_STORAGE_KEY, 
  RESET_STORAGE_KEY, 
  DAY_RESET_TIME_STORAGE_KEY,
  RECENT_INTENTS_STORAGE_KEY,
  SOUND_ENABLED_STORAGE_KEY,
  DISTRACTION_TAGS
} from './constants';
import Timer from './components/Timer';
import Timeline from './components/Timeline';
import LogTable from './components/LogTable';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DayResetSettingsModal from './components/DayResetSettingsModal';
import ManualSessionModal from './components/ManualSessionModal';
import NavigationMenuModal from './components/NavigationMenuModal';
import { playChime } from './utils/audio';
import { getVirtualDayStart, formatVirtualDayKey } from './utils/dateUtils';
import { generateDemoSessions } from './utils/demoData';
import confetti from 'canvas-confetti';
import { 
  Focus, 
  Coffee, 
  AlertCircle, 
  Target, 
  X, 
  Square, 
  Command, 
  ChevronDown,
  ChevronUp,
  Menu,
  AppWindow,
  Minimize2,
  Maximize2,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as Theme) || 'light';
  });

  // Active Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');

  // Floating Widget Mode toggle
  const [isFloatingWidget, setIsFloatingWidget] = useState<boolean>(false);
  const [showTodayLogs, setShowTodayLogs] = useState<boolean>(true);

  // Helper for safe JSON parsing
  const safeGetJson = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>(() => {
    return safeGetJson<Session[]>(SESSION_STORAGE_KEY, []);
  });

  // Day Reset Time setting (e.g. "04:00")
  const [dayResetTime, setDayResetTime] = useState<string>(() => {
    try {
      return localStorage.getItem(DAY_RESET_TIME_STORAGE_KEY) || '04:00';
    } catch {
      return '04:00';
    }
  });

  // Manual Block Reset Time
  const [lastResetTime, setLastResetTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(RESET_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : new Date().setHours(0, 0, 0, 0);
    } catch {
      return new Date().setHours(0, 0, 0, 0);
    }
  });

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  // Recent Mission Intents
  const [recentIntents, setRecentIntents] = useState<string[]>(() => {
    return safeGetJson<string[]>(RECENT_INTENTS_STORAGE_KEY, [
      'Deep Work & Architecture',
      'Code Review & Refactoring',
      'Product Strategy & Roadmap',
      'Documentation & Planning'
    ]);
  });

  // Active Session & Timer state
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [currentIntent, setCurrentIntent] = useState("");
  const [timelineViewMode, setTimelineViewMode] = useState<'block' | 'day'>('day');

  // Modals state
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [tempReflection, setTempReflection] = useState("");
  const [pendingNextMode, setPendingNextMode] = useState<SessionMode | null>(null);
  const [showDayResetModal, setShowDayResetModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Reset Confirmation state
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  // Persist Theme & Apply Class
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    if (isDark) {
      document.body.classList.add('bg-zinc-950', 'text-white');
      document.body.classList.remove('bg-white', 'text-zinc-900');
    } else {
      document.body.classList.remove('bg-zinc-950', 'text-white');
      document.body.classList.add('bg-white', 'text-zinc-900');
    }
  }, [theme]);

  // Persist Sessions
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Unable to persist sessions to localStorage:', e);
    }
  }, [sessions]);

  // Persist Day Reset Time
  useEffect(() => {
    try {
      localStorage.setItem(DAY_RESET_TIME_STORAGE_KEY, dayResetTime);
    } catch {}
  }, [dayResetTime]);

  // Persist Manual Reset
  useEffect(() => {
    try {
      localStorage.setItem(RESET_STORAGE_KEY, lastResetTime.toString());
    } catch {}
  }, [lastResetTime]);

  // Persist Sound Enabled
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, soundEnabled ? 'true' : 'false');
    } catch {}
  }, [soundEnabled]);

  // Persist Recent Intents
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_INTENTS_STORAGE_KEY, JSON.stringify(recentIntents));
    } catch {}
  }, [recentIntents]);

  // Timer Tick & Dynamic Browser Tab Title
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (activeSession) {
        const elapsedSec = Math.floor((now - activeSession.startTime) / 1000);
        const mins = Math.floor(elapsedSec / 60);
        const secs = elapsedSec % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const icon = activeSession.mode === SessionMode.FOCUSED ? '🎯' : activeSession.mode === SessionMode.REST ? '☕' : '⚡';
        document.title = `${icon} ${timeStr} | ${activeSession.intent || activeSession.mode} - FlowState`;
      } else {
        document.title = 'FlowState | Progressive Tracker';
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const saveIntentToRecent = (intent: string) => {
    if (!intent.trim()) return;
    setRecentIntents(prev => {
      const filtered = prev.filter(i => i.toLowerCase() !== intent.trim().toLowerCase());
      return [intent.trim(), ...filtered].slice(0, 8);
    });
  };

  const startSession = (mode: SessionMode) => {
    const intentToUse = currentIntent.trim() || undefined;
    if (intentToUse) {
      saveIntentToRecent(intentToUse);
    }
    const newSession: Session = {
      id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
      mode,
      startTime: Date.now(),
      intent: intentToUse
    };
    setActiveSession(newSession);
    if (soundEnabled) playChime('start');
  };

  const handleModeClick = (mode: SessionMode) => {
    if (activeSession) {
      if (activeSession.mode === mode) {
        handleEndSessionAction();
      } else {
        if (activeSession.mode === SessionMode.DISTRACTED) {
          setPendingNextMode(mode);
          setTempReflection("");
          setShowReflectionModal(true);
        } else {
          const endTime = Date.now();
          const duration = endTime - activeSession.startTime;
          const completed: Session = {
            ...activeSession,
            endTime,
            duration,
          };
          setSessions(prev => [completed, ...prev]);
          if (soundEnabled) playChime('switch');
          startSession(mode);
        }
      }
    } else {
      startSession(mode);
    }
  };

  const handleEndSessionAction = () => {
    if (!activeSession) return;
    if (activeSession.mode === SessionMode.DISTRACTED) {
      setTempReflection("");
      setShowReflectionModal(true);
    } else {
      finalizeEndSession();
    }
  };

  const finalizeEndSession = (reflection?: string) => {
    if (!activeSession) return;
    const endTime = Date.now();
    const duration = endTime - activeSession.startTime;

    const completedSession: Session = {
      ...activeSession,
      endTime,
      duration,
      reflection: reflection?.trim() || undefined
    };

    // Confetti celebration for solid deep work sessions (>= 25 min)
    if (activeSession.mode === SessionMode.FOCUSED && duration >= 25 * 60 * 1000) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
        });
      } catch {}
    }

    if (soundEnabled) playChime('complete');

    setSessions(prev => [completedSession, ...prev]);
    setActiveSession(null);
    setShowReflectionModal(false);
    
    if (pendingNextMode) {
      startSession(pendingNextMode);
      setPendingNextMode(null);
    }
  };

  const handleResetBlock = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    if (activeSession) {
      const endTime = Date.now();
      const completed: Session = {
        ...activeSession,
        endTime,
        duration: endTime - activeSession.startTime,
      };
      setSessions(prev => [completed, ...prev]);
      setActiveSession(null);
    }
    
    setLastResetTime(Date.now());
    setCurrentIntent("");
    setConfirmReset(false);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'f' || e.key === 'F' || e.key === '1') {
        e.preventDefault();
        handleModeClick(SessionMode.FOCUSED);
      } else if (e.key === 'r' || e.key === 'R' || e.key === '2') {
        e.preventDefault();
        handleModeClick(SessionMode.REST);
      } else if (e.key === 'd' || e.key === 'D' || e.key === '3') {
        e.preventDefault();
        handleModeClick(SessionMode.DISTRACTED);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setIsFloatingWidget(prev => !prev);
      } else if (e.key === ' ' || e.key === 'Escape') {
        if (activeSession) {
          e.preventDefault();
          handleEndSessionAction();
        }
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTab('timer');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTab('analytics');
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'l' || e.key === 'L') {
        setActiveTab('history');
      } else if (e.key === 'm' || e.key === 'M') {
        setShowMenuModal(prev => !prev);
      } else if (e.key === '?') {
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSession, handleModeClick]);

  // Save manual or edited session
  const handleSaveManualSession = (sessionToSave: Session) => {
    setSessions(prev => {
      const exists = prev.some(s => s.id === sessionToSave.id);
      if (exists) {
        return prev.map(s => (s.id === sessionToSave.id ? sessionToSave : s));
      }
      return [sessionToSave, ...prev].sort((a, b) => b.startTime - a.startTime);
    });
    setEditingSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleLoadDemoHistory = () => {
    if (confirm('Load 14 days of realistic demo flow sessions to test the analytics dashboard? Your current sessions will be merged.')) {
      const demo = generateDemoSessions();
      setSessions(prev => [...demo, ...prev]);
      setActiveTab('analytics');
    }
  };

  const exportCSV = () => {
    if (sessions.length === 0) return;
    const sanitizeCSVCell = (val: string = '') => {
      let str = val.replace(/"/g, '""');
      // Prevent CSV formula injection in spreadsheet applications (CWE-1236)
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const headers = ['ID', 'Mode', 'Start Time', 'End Time', 'Duration (ms)', 'Intent', 'Reflection'];
    const rows = sessions.map(s => {
      const start = new Date(s.startTime).toLocaleString();
      const end = s.endTime ? new Date(s.endTime).toLocaleString() : 'Active';
      return [
        s.id,
        s.mode,
        sanitizeCSVCell(start),
        sanitizeCSVCell(end),
        s.duration || 0, 
        sanitizeCSVCell(s.intent || ''), 
        sanitizeCSVCell(s.reflection || '')
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    link.setAttribute('download', `flowstate_${year}-${month}-${day}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Count of today's sessions for summary
  const todaySessionsCount = useMemo(() => {
    const dayStart = getVirtualDayStart(currentTime, dayResetTime);
    return sessions.filter(s => s.startTime >= dayStart).length;
  }, [sessions, currentTime, dayResetTime]);

  return (
    <div className={`min-h-screen flex flex-col relative bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 select-none sm:select-auto`}>
      
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between pointer-events-none">
        {/* Left: App Logo / Active Flow Status */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('timer')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/85 dark:bg-zinc-900/85 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 shadow-md backdrop-blur-md transition-all group"
            title="FlowState Cockpit"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
            <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-white uppercase">
              Flow<span className="text-emerald-500">State</span>
            </span>
            {activeSession && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {activeSession.mode}
              </span>
            )}
          </button>
        </div>

        {/* Right: Floating Widget View Toggle & Menu */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Floating Widget Mode Toggle */}
          <button
            onClick={() => setIsFloatingWidget(prev => !prev)}
            className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-bold ${
              isFloatingWidget
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30'
                : 'bg-white/85 dark:bg-zinc-900/85 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-800 shadow-black/5 dark:shadow-black/20'
            }`}
            title={isFloatingWidget ? "Switch to Standard View (Press W)" : "Switch to Floating Mini Widget (Press W)"}
            aria-label="Toggle Floating Window Mode"
          >
            {isFloatingWidget ? <Maximize2 size={16} /> : <AppWindow size={16} />}
            <span className="hidden md:inline text-[10px] uppercase tracking-wider font-black">
              {isFloatingWidget ? 'Standard View' : 'Floating View'}
            </span>
          </button>

          {/* Menu Trigger */}
          <button
            onClick={() => setShowMenuModal(true)}
            className="p-2.5 rounded-2xl bg-white/85 dark:bg-zinc-900/85 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 shadow-md shadow-black/5 dark:shadow-black/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
            title="Menu & Preferences (Press M)"
            aria-label="Open Menu"
          >
            <Menu size={18} className="group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto transition-all ${
        isFloatingWidget ? 'max-w-xl px-2 sm:px-4 py-1 space-y-3' : 'max-w-5xl px-3 sm:px-6 py-2 sm:py-6 space-y-8'
      }`}>
        
        {/* TAB 1: TIMER & LIVE FLOW (DEFAULT COCKPIT) */}
        {activeTab === 'timer' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            
            {/* UNIFIED FLOATING COCKPIT CARD (Stopwatch + Action Buttons + Progress Flow Bar) */}
            <div className={`w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl rounded-3xl transition-all ${
              isFloatingWidget ? 'p-3.5 sm:p-5 space-y-3.5 ring-2 ring-emerald-500/20' : 'p-4 sm:p-7 space-y-4 sm:space-y-6'
            }`}>
              
              {/* Mission Row */}
              {!activeSession ? (
                <div className="w-full relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                    <Target size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={currentIntent}
                    onChange={(e) => setCurrentIntent(e.target.value)}
                    placeholder="Declare your mission..."
                    className="w-full bg-zinc-100/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-2.5 sm:py-3 pl-11 pr-10 text-center focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                  {recentIntents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowRecentDropdown(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      title="Select from recent missions"
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}

                  {/* Dropdown for Recent Missions */}
                  {showRecentDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-3 py-1">
                        Recent Missions
                      </p>
                      {recentIntents.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCurrentIntent(item);
                            setShowRecentDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full flex items-center justify-center animate-in fade-in duration-300">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-full truncate">
                    <Target size={14} className="shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold italic truncate">
                      "{currentIntent || 'Deep Work'}"
                    </span>
                  </div>
                </div>
              )}

              {/* Main Stopwatch Timer */}
              <Timer 
                activeSession={activeSession} 
                currentTime={currentTime} 
                onEnd={handleEndSessionAction}
                compact={isFloatingWidget} 
              />
              
              {/* 3 Action Buttons in 1 Row (Focus, Rest, Distracted) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                {/* Focus Button */}
                <button 
                  onClick={() => handleModeClick(SessionMode.FOCUSED)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl font-black uppercase tracking-wider text-[10px] sm:text-xs transition-all active:scale-95 ${
                    activeSession?.mode === SessionMode.FOCUSED 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400 scale-[1.02]' 
                    : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30'
                  }`}
                  title="Focus (Press 1 or F)"
                >
                  {activeSession?.mode === SessionMode.FOCUSED ? <Square size={14} fill="currentColor" /> : <Focus size={14} />}
                  <span>{activeSession?.mode === SessionMode.FOCUSED ? 'End Focus' : 'Focus'}</span>
                </button>

                {/* Rest Button */}
                <button 
                  onClick={() => handleModeClick(SessionMode.REST)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl font-black uppercase tracking-wider text-[10px] sm:text-xs transition-all active:scale-95 ${
                    activeSession?.mode === SessionMode.REST 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 ring-2 ring-sky-400 scale-[1.02]' 
                    : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-sky-500/15 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/30'
                  }`}
                  title="Rest (Press 2 or R)"
                >
                  {activeSession?.mode === SessionMode.REST ? <Square size={14} fill="currentColor" /> : <Coffee size={14} />}
                  <span>{activeSession?.mode === SessionMode.REST ? 'End Rest' : 'Rest'}</span>
                </button>

                {/* Distracted Button */}
                <button 
                  onClick={() => handleModeClick(SessionMode.DISTRACTED)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl font-black uppercase tracking-wider text-[10px] sm:text-xs transition-all active:scale-95 ${
                    activeSession?.mode === SessionMode.DISTRACTED 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-400 scale-[1.02]' 
                    : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30'
                  }`}
                  title="Distracted (Press 3 or D)"
                >
                  {activeSession?.mode === SessionMode.DISTRACTED ? <Square size={14} fill="currentColor" /> : <AlertCircle size={14} />}
                  <span>{activeSession?.mode === SessionMode.DISTRACTED ? 'End Distr.' : 'Distracted'}</span>
                </button>
              </div>

              {/* Progress Flow Bar (Timeline Canvas) directly in Cockpit */}
              <div className="w-full pt-1">
                <Timeline 
                  sessions={sessions} 
                  activeSession={activeSession} 
                  currentTime={currentTime} 
                  lastResetTime={lastResetTime}
                  dayResetTime={dayResetTime}
                  viewMode={timelineViewMode}
                  onToggleViewMode={() => setTimelineViewMode(prev => prev === 'block' ? 'day' : 'block')}
                  compact={isFloatingWidget}
                />
              </div>
            </div>

            {/* Today's All Session Logs Section */}
            <div className="w-full space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    Today's Session Logs
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {todaySessionsCount} {todaySessionsCount === 1 ? 'entry' : 'entries'}
                    </span>
                  </h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 hidden sm:block">
                    Active day cycle resets at {dayResetTime}
                  </p>
                </div>

                {isFloatingWidget && (
                  <button
                    onClick={() => setShowTodayLogs(prev => !prev)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    <span>{showTodayLogs ? 'Hide Logs' : 'Show Logs'}</span>
                    {showTodayLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {(!isFloatingWidget || showTodayLogs) && (
                <div className="animate-in fade-in duration-200">
                  <LogTable 
                    sessions={sessions}
                    activeSession={activeSession}
                    currentTime={currentTime}
                    dayResetTime={dayResetTime}
                    onEditSession={(session) => {
                      setEditingSession(session);
                      setShowManualModal(true);
                    }}
                    onDeleteSession={handleDeleteSession}
                    onAddNewSession={() => {
                      setEditingSession(null);
                      setShowManualModal(true);
                    }}
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ANALYTICS & INSIGHTS DASHBOARD */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard sessions={sessions} dayResetTime={dayResetTime} />
        )}

        {/* TAB 3: COMPLETE HISTORY & LOG TABLE */}
        {activeTab === 'history' && (
          <section className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Session History & Logs
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                  Complete day records grouped by your {dayResetTime} reset boundary
                </p>
              </div>
            </div>

            <LogTable 
              sessions={sessions}
              activeSession={activeSession}
              currentTime={currentTime}
              dayResetTime={dayResetTime}
              onEditSession={(session) => {
                setEditingSession(session);
                setShowManualModal(true);
              }}
              onDeleteSession={handleDeleteSession}
              onAddNewSession={() => {
                setEditingSession(null);
                setShowManualModal(true);
              }}
            />
          </section>
        )}

      </main>

      {/* MODAL 1: DISTRACTION REFLECTION MODAL */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Reflection
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-rose-500 mt-0.5">
                  Interrupted Flow
                </p>
              </div>
              <button 
                onClick={() => { setShowReflectionModal(false); setPendingNextMode(null); }} 
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-500/5 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                <p className="text-rose-500/70 text-[9px] uppercase font-bold tracking-widest mb-1">Stated Mission</p>
                <p className="text-base text-zinc-800 dark:text-zinc-200 italic font-semibold">
                  "{currentIntent || 'Deep Work'}"
                </p>
              </div>

              {/* Quick Distraction Reason Chips */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Quick Select Trigger
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISTRACTION_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTempReflection(tag)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Or Describe What Broke State
                </label>
                <textarea 
                  autoFocus
                  value={tempReflection}
                  onChange={(e) => setTempReflection(e.target.value)}
                  placeholder="Note the distraction briefly..."
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all resize-none text-zinc-900 dark:text-zinc-100 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => finalizeEndSession(tempReflection)}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-rose-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Log Reflection
              </button>
              <button 
                onClick={() => finalizeEndSession()}
                className="py-3.5 px-6 bg-zinc-100 dark:bg-zinc-800 font-black uppercase tracking-widest text-[10px] rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DAY RESET SETTINGS MODAL */}
      <DayResetSettingsModal 
        isOpen={showDayResetModal}
        onClose={() => setShowDayResetModal(false)}
        dayResetTime={dayResetTime}
        onSaveDayResetTime={(newTime) => setDayResetTime(newTime)}
      />

      {/* MODAL 3: MANUAL SESSION ADD / EDIT MODAL */}
      <ManualSessionModal 
        isOpen={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setEditingSession(null);
        }}
        onSave={handleSaveManualSession}
        onDelete={handleDeleteSession}
        initialSession={editingSession}
      />

      {/* MODAL 4: KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Command size={18} />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'F or 1', desc: 'Start or toggle Focus mode' },
                { key: 'R or 2', desc: 'Start or toggle Rest mode' },
                { key: 'D or 3', desc: 'Start or toggle Distracted mode' },
                { key: 'W', desc: 'Toggle Floating Mini Window mode' },
                { key: 'Space / Esc', desc: 'End current active session' },
                { key: 'T', desc: 'Switch to Timer view' },
                { key: 'A', desc: 'Switch to Analytics dashboard' },
                { key: 'L or H', desc: 'Switch to History Logs' },
                { key: 'M', desc: 'Toggle Navigation & Menu' },
                { key: '?', desc: 'Open shortcuts guide' },
              ].map((sc, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">{sc.desc}</span>
                  <kbd className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 shadow-sm">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-3 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: LOGICALLY ORGANIZED NAVIGATION MENU */}
      <NavigationMenuModal 
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        dayResetTime={dayResetTime}
        onOpenDayResetModal={() => setShowDayResetModal(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onExportCSV={exportCSV}
        onResetBlock={handleResetBlock}
        confirmReset={confirmReset}
        onLoadDemoData={handleLoadDemoHistory}
        onOpenManualModal={() => {
          setEditingSession(null);
          setShowManualModal(true);
        }}
        sessionCount={sessions.length}
      />

    </div>
  );
};

export default App;
