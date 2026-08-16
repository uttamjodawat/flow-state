import React, { useState, useMemo } from 'react';
import { Session, SessionMode } from '../types';
import { MODE_COLORS } from '../constants';
import { 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Zap, 
  Coffee, 
  AlertCircle 
} from 'lucide-react';
import { 
  getVirtualDayStart, 
  formatVirtualDayKey, 
  formatDuration 
} from '../utils/dateUtils';

interface LogTableProps {
  sessions: Session[];
  dayResetTime: string;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddNewSession: () => void;
}

type DateFilterMode = 'today' | 'week' | 'all';

const LogTable: React.FC<LogTableProps> = ({
  sessions,
  dayResetTime,
  onEditSession,
  onDeleteSession,
  onAddNewSession,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterMode>('today');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Track expanded state of day sections; default current day to true
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const currentDayStart = useMemo(() => getVirtualDayStart(Date.now(), dayResetTime), [dayResetTime]);
  const currentDayKey = useMemo(() => formatVirtualDayKey(Date.now(), dayResetTime), [dayResetTime]);

  // Group and filter sessions
  const groupedData = useMemo(() => {
    const groups: Record<string, { dateTimestamp: number; sessions: Session[]; totalFocus: number; totalRest: number; totalDist: number }> = {};

    const filtered = sessions.filter(session => {
      // Mode filter
      if (modeFilter !== 'ALL' && session.mode !== modeFilter) return false;

      // Date range filter
      if (dateFilter === 'today') {
        const sessionDayStart = getVirtualDayStart(session.startTime, dayResetTime);
        if (sessionDayStart !== currentDayStart) return false;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = currentDayStart - 6 * 24 * 60 * 60 * 1000;
        if (session.startTime < sevenDaysAgo) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const intentMatch = session.intent?.toLowerCase().includes(q);
        const reflectionMatch = session.reflection?.toLowerCase().includes(q);
        const modeMatch = session.mode.toLowerCase().includes(q);
        if (!intentMatch && !reflectionMatch && !modeMatch) return false;
      }

      return true;
    });

    filtered.forEach(session => {
      const dayKey = formatVirtualDayKey(session.startTime, dayResetTime);
      const dayStart = getVirtualDayStart(session.startTime, dayResetTime);

      if (!groups[dayKey]) {
        groups[dayKey] = {
          dateTimestamp: dayStart,
          sessions: [],
          totalFocus: 0,
          totalRest: 0,
          totalDist: 0,
        };
      }

      groups[dayKey].sessions.push(session);
      const duration = session.duration || 0;
      if (session.mode === SessionMode.FOCUSED) groups[dayKey].totalFocus += duration;
      else if (session.mode === SessionMode.REST) groups[dayKey].totalRest += duration;
      else if (session.mode === SessionMode.DISTRACTED) groups[dayKey].totalDist += duration;
    });

    // Sort days descending
    return Object.entries(groups).sort((a, b) => b[1].dateTimestamp - a[1].dateTimestamp);
  }, [sessions, dayResetTime, currentDayStart, dateFilter, modeFilter, searchQuery]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayKey]: prev[dayKey] === undefined ? false : !prev[dayKey],
    }));
  };

  const isDayExpanded = (dayKey: string) => {
    // Current day is expanded by default unless explicitly closed; others closed by default
    if (expandedDays[dayKey] !== undefined) return expandedDays[dayKey];
    return dayKey === currentDayKey || groupedData.length === 1;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Control Bar: Filters, Search, Add Session */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-zinc-50 dark:bg-zinc-900/60 p-3 sm:p-4 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
        
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'today', label: 'Complete Day' },
            { id: 'week', label: 'Past 7 Days' },
            { id: 'all', label: 'All History' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as DateFilterMode)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                dateFilter === f.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions, reflections..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Mode Filter & Add Missed Session */}
        <div className="flex items-center gap-2">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="ALL">All Modes</option>
            <option value={SessionMode.FOCUSED}>Focused Only</option>
            <option value={SessionMode.REST}>Rest Only</option>
            <option value={SessionMode.DISTRACTED}>Distracted Only</option>
          </select>

          <button
            onClick={onAddNewSession}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <PlusCircle size={14} />
            <span>Add Session</span>
          </button>
        </div>

      </div>

      {/* Empty State */}
      {groupedData.length === 0 ? (
        <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
          <Calendar className="mx-auto text-zinc-300 dark:text-zinc-700" size={40} />
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            {dateFilter === 'today' ? 'No sessions logged for today yet.' : 'No sessions match your filter criteria.'}
          </p>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto font-medium">
            Start a live focus session from the timer or click "Add Session" to record a past block.
          </p>
          <button
            onClick={onAddNewSession}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600 transition-colors"
          >
            <PlusCircle size={14} /> Add Session
          </button>
        </div>
      ) : (
        /* Grouped Day Cards */
        <div className="space-y-4">
          {groupedData.map(([dayKey, dayData]) => {
            const expanded = isDayExpanded(dayKey);
            const isToday = dayKey === currentDayKey;

            return (
              <div 
                key={dayKey}
                className="overflow-hidden rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all"
              >
                {/* Day Header Accordion Toggle */}
                <button
                  onClick={() => toggleDay(dayKey)}
                  className="w-full p-5 sm:p-6 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors text-left flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-3 rounded-2xl ${isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                          {dayKey}
                        </h3>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                            Active Day
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                        {dayData.sessions.length} Sessions Logged
                      </p>
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block">Focus Time</span>
                        <span className="text-xs font-black mono text-emerald-500">{formatDuration(dayData.totalFocus)}</span>
                      </div>
                      {dayData.totalRest > 0 && (
                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block">Rest</span>
                          <span className="text-xs font-black mono text-sky-500">{formatDuration(dayData.totalRest)}</span>
                        </div>
                      )}
                      {dayData.totalDist > 0 && (
                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block">Distracted</span>
                          <span className="text-xs font-black mono text-rose-500">{formatDuration(dayData.totalDist)}</span>
                        </div>
                      )}
                    </div>

                    <div className={`p-2 rounded-full transition-transform duration-300 ${expanded ? 'rotate-180 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </button>

                {/* Expanded Session Table */}
                {expanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 duration-300">
                    <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                          <th className="w-28 px-6 py-3.5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Mode</th>
                          <th className="w-36 px-6 py-3.5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Time Interval</th>
                          <th className="w-24 px-6 py-3.5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Duration</th>
                          <th className="px-6 py-3.5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Mission & Reflections</th>
                          <th className="w-20 px-6 py-3.5 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                        {dayData.sessions.map((session) => (
                          <tr key={session.id} className="group transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                            
                            {/* Mode badge */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${MODE_COLORS[session.mode].bg}`} />
                                <span className={`text-[10px] font-black tracking-widest uppercase ${MODE_COLORS[session.mode].text}`}>
                                  {session.mode}
                                </span>
                              </div>
                            </td>

                            {/* Clock Time */}
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                                <Clock size={12} className="opacity-50" />
                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="opacity-40">→</span>
                                {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                              </span>
                            </td>

                            {/* Duration */}
                            <td className="px-6 py-4">
                              <span className="text-xs font-black mono text-zinc-900 dark:text-zinc-100">
                                {formatDuration(session.duration || 0)}
                              </span>
                            </td>

                            {/* Mission / Reflection Notes */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 max-w-full">
                                {session.intent && (
                                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium leading-tight line-clamp-1 group-hover:line-clamp-none transition-all">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tight mr-1.5 opacity-80">Mission</span>
                                    {session.intent}
                                  </p>
                                )}
                                {session.reflection && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic leading-tight line-clamp-1 group-hover:line-clamp-none transition-all">
                                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-tight mr-1.5 opacity-80">Reflection</span>
                                    {session.reflection}
                                  </p>
                                )}
                                {!session.intent && !session.reflection && (
                                  <span className="text-xs text-zinc-300 dark:text-zinc-700 italic">No notes</span>
                                )}
                              </div>
                            </td>

                            {/* Row Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditSession(session)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="Edit Session"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this session record?')) {
                                      onDeleteSession(session.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                  title="Delete Session"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default LogTable;
