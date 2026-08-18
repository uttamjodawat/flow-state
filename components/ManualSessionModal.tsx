import React, { useState, useEffect, useMemo } from 'react';
import { X, PlusCircle, Edit3, Trash2, Zap, Coffee, AlertCircle, Clock } from 'lucide-react';
import { Session, SessionMode } from '../types';
import { MODE_COLORS, DISTRACTION_TAGS } from '../constants';
import { formatDuration } from '../utils/dateUtils';

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
  initialSession?: Session | null;
  defaultStartTime?: number;
  defaultEndTime?: number;
}

const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialSession,
  defaultStartTime,
  defaultEndTime,
}) => {
  const isEditing = !!initialSession && initialSession.id !== 'idle' && !initialSession.id.startsWith('untracked-');

  // If initialSession is untracked (IDLE), default to FOCUSED for easy claiming
  const initialMode = initialSession?.mode === SessionMode.IDLE ? SessionMode.FOCUSED : (initialSession?.mode || SessionMode.FOCUSED);
  const [mode, setMode] = useState<SessionMode>(initialMode);
  const [intent, setIntent] = useState(initialSession?.intent || '');
  const [reflection, setReflection] = useState(initialSession?.reflection || '');
  
  // Helpers to format Date into local YYYY-MM-DD and HH:MM
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatLocalTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Initial Date & Times
  const [dateStr, setDateStr] = useState(() => formatLocalDate(new Date()));
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('09:25');

  useEffect(() => {
    if (!isOpen) return;

    if (initialSession) {
      setMode(initialSession.mode === SessionMode.IDLE ? SessionMode.FOCUSED : initialSession.mode);
      setIntent(initialSession.intent || '');
      setReflection(initialSession.reflection || '');
      const sDate = new Date(initialSession.startTime);
      const eDate = new Date(
        initialSession.endTime || 
        (initialSession.startTime + (initialSession.duration || 25 * 60 * 1000))
      );
      setDateStr(formatLocalDate(sDate));
      setStartTimeStr(formatLocalTime(sDate));
      setEndTimeStr(formatLocalTime(eDate));
    } else {
      setMode(SessionMode.FOCUSED);
      setIntent('');
      setReflection('');
      const start = defaultStartTime ? new Date(defaultStartTime) : new Date(Date.now() - 25 * 60 * 1000);
      const end = defaultEndTime ? new Date(defaultEndTime) : new Date(start.getTime() + 25 * 60 * 1000);
      setDateStr(formatLocalDate(start));
      setStartTimeStr(formatLocalTime(start));
      setEndTimeStr(formatLocalTime(end));
    }
  }, [initialSession, defaultStartTime, defaultEndTime, isOpen]);

  // Calculate live duration in milliseconds from start and end time
  const calculatedDurationMs = useMemo(() => {
    if (!startTimeStr || !endTimeStr) return 0;
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

    let startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;

    // Support overnight sessions if end is earlier in day than start
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const diffMinutes = endMinutes - startMinutes;
    return Math.max(0, diffMinutes * 60 * 1000);
  }, [startTimeStr, endTimeStr]);

  // Helper to adjust End Time via quick presets
  const applyDurationPreset = (minutesToAdd: number) => {
    const [sh, sm] = startTimeStr.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm)) return;
    const totalMinutes = sh * 60 + sm + minutesToAdd;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    setEndTimeStr(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = dateStr.split('-').map(Number);
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);

    const startDate = new Date(
      year || new Date().getFullYear(),
      (month || 1) - 1,
      day || 1,
      isNaN(sh) ? 0 : sh,
      isNaN(sm) ? 0 : sm,
      0,
      0
    );

    const startTime = startDate.getTime();
    let duration = calculatedDurationMs;
    
    // Fallback minimum of 1 minute if same time entered
    if (duration <= 0) {
      duration = 60 * 1000;
    }
    const endTime = startTime + duration;

    // Generate clean ID or reuse editing session ID (ignoring temporary untracked- prefix)
    const isTempId = !initialSession?.id || initialSession.id === 'idle' || initialSession.id.startsWith('untracked-');
    const sessionId = isTempId 
      ? (crypto.randomUUID ? crypto.randomUUID() : `manual-${Date.now()}`)
      : initialSession.id;

    const savedSession: Session = {
      id: sessionId,
      mode,
      startTime,
      endTime,
      duration,
      intent: intent.trim() || undefined,
      reflection: reflection.trim() || undefined,
    };

    onSave(savedSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              {isEditing ? <Edit3 size={20} /> : <PlusCircle size={20} />}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {isEditing ? 'Edit Session' : 'Add Session'}
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {isEditing ? 'Modify Past Record' : 'Record Time Interval'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Session Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode(SessionMode.FOCUSED)}
                className={`py-3 px-3 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                  mode === SessionMode.FOCUSED
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                }`}
              >
                <Zap size={13} /> Focus
              </button>
              <button
                type="button"
                onClick={() => setMode(SessionMode.REST)}
                className={`py-3 px-3 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                  mode === SessionMode.REST
                    ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-sky-500/40'
                }`}
              >
                <Coffee size={13} /> Rest
              </button>
              <button
                type="button"
                onClick={() => setMode(SessionMode.DISTRACTED)}
                className={`py-3 px-3 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                  mode === SessionMode.DISTRACTED
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-rose-500/40'
                }`}
              >
                <AlertCircle size={13} /> Distracted
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Start Time and End Time Inputs */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock size={11} /> Start Time
                </label>
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm font-medium font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock size={11} /> End Time
                </label>
                <input
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm font-medium font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live Calculated Duration Badge & Quick Offset Helpers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Duration:
                </span>
                <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-lg ${
                  calculatedDurationMs > 0 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {calculatedDurationMs > 0 ? formatDuration(calculatedDurationMs) : '0 min'}
                </span>
              </div>

              {/* Quick Preset Buttons to Auto-Advance End Time */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mr-0.5">Quick:</span>
                {[15, 25, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => applyDurationPreset(mins)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Intent / Mission */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Mission / Goal
            </label>
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Fix database indexing, Design prototype"
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Reflection or Distraction notes */}
          {mode === SessionMode.DISTRACTED && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                Distraction Cause & Reflection
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DISTRACTION_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setReflection(prev => prev ? `${prev} | ${tag}` : tag)}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 hover:bg-rose-100 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What interrupted or caused the distraction?"
                rows={2}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            {isEditing && onDelete && initialSession && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this session record?')) {
                    onDelete(initialSession.id);
                    onClose();
                  }
                }}
                className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-500/20 transition-colors"
                title="Delete Session"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-bold uppercase tracking-widest text-[10px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isEditing ? 'Save Changes' : 'Add Session'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ManualSessionModal;
