import React, { useState } from 'react';
import { X, Clock, Sparkles, Check, Info } from 'lucide-react';
import { DAY_RESET_PRESETS } from '../constants';
import { parseResetTime } from '../utils/dateUtils';

interface DayResetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayResetTime: string;
  onSaveDayResetTime: (newTime: string) => void;
}

const DayResetSettingsModal: React.FC<DayResetSettingsModalProps> = ({
  isOpen,
  onClose,
  dayResetTime,
  onSaveDayResetTime,
}) => {
  const [selectedTime, setSelectedTime] = useState(dayResetTime || '04:00');
  const [customInput, setCustomInput] = useState(dayResetTime || '04:00');

  if (!isOpen) return null;

  const handlePresetSelect = (time: string) => {
    setSelectedTime(time);
    setCustomInput(time);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value);
    setSelectedTime(e.target.value);
  };

  const handleSave = () => {
    const { hours, minutes } = parseResetTime(customInput);
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onSaveDayResetTime(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Day Reset Time
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Workday Boundary Definition
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

        {/* Explanatory Banner */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex items-start gap-3">
          <Info size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            Sessions logged after this time belong to the new day. For night owls working past midnight (e.g. at 2 AM), setting this to <strong className="text-emerald-600 dark:text-emerald-400">04:00 AM</strong> keeps your late-night sessions grouped in yesterday's flow.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Select Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DAY_RESET_PRESETS.map(preset => {
              const isSelected = selectedTime === preset.time;
              return (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => handlePresetSelect(preset.time)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{preset.label}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-black">
                        {preset.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-tight">
                      {preset.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
            <Sparkles size={12} /> Custom Reset Time (24h)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={customInput}
              onChange={handleCustomChange}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-base font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-zinc-400">
              Active setting: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{customInput}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-bold uppercase tracking-widest text-[10px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            Apply Reset Time
          </button>
        </div>

      </div>
    </div>
  );
};

export default DayResetSettingsModal;
