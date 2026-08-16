import React from 'react';
import { ActiveTab, Theme } from '../types';
import { 
  Clock, 
  BarChart3, 
  History, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Command, 
  Download, 
  RotateCcw, 
  Sparkles, 
  X, 
  Focus,
  Check,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  Sliders
} from 'lucide-react';

interface NavigationMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  dayResetTime: string;
  onOpenDayResetModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
  onExportCSV: () => void;
  onResetBlock: () => void;
  confirmReset: boolean;
  onLoadDemoData: () => void;
  onOpenManualModal: () => void;
  sessionCount: number;
}

const NavigationMenuModal: React.FC<NavigationMenuModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  dayResetTime,
  onOpenDayResetModal,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onOpenShortcuts,
  onExportCSV,
  onResetBlock,
  confirmReset,
  onLoadDemoData,
  onOpenManualModal,
  sessionCount,
}) => {
  if (!isOpen) return null;

  const handleNav = (tab: ActiveTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over menu panel */}
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-zinc-900 h-full border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between overflow-y-auto p-6 sm:p-8 animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Focus className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white leading-tight">
                  FlowState
                </h2>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  Menu & Preferences
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Section 1: Navigation & Views */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
              Views & Workspaces
            </span>

            <div className="space-y-1.5">
              <button
                onClick={() => handleNav('timer')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs transition-all ${
                  activeTab === 'timer'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} />
                  <div className="text-left">
                    <span className="block font-black uppercase tracking-wider text-[11px]">Timer & Flow</span>
                    <span className={`text-[9px] font-medium block opacity-80`}>Primary Focus Cockpit</span>
                  </div>
                </div>
                {activeTab === 'timer' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                    Active
                  </span>
                ) : (
                  <ChevronRight size={14} className="opacity-40" />
                )}
              </button>

              <button
                onClick={() => handleNav('analytics')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={16} />
                  <div className="text-left">
                    <span className="block font-black uppercase tracking-wider text-[11px]">Analytics & Trends</span>
                    <span className="text-[9px] font-medium block opacity-80">Daily, Weekly & Cognitive DNA</span>
                  </div>
                </div>
                {activeTab === 'analytics' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                    Active
                  </span>
                ) : (
                  <ChevronRight size={14} className="opacity-40" />
                )}
              </button>

              <button
                onClick={() => handleNav('history')}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs transition-all ${
                  activeTab === 'history'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History size={16} />
                  <div className="text-left">
                    <span className="block font-black uppercase tracking-wider text-[11px]">Session Logs</span>
                    <span className="text-[9px] font-medium block opacity-80">Complete History & Edits</span>
                  </div>
                </div>
                {activeTab === 'history' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20">
                    Active
                  </span>
                ) : (
                  <ChevronRight size={14} className="opacity-40" />
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Day Reset Configuration */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
              Day Reset Boundary
            </span>

            <button
              onClick={() => {
                onOpenDayResetModal();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sliders size={16} className="text-emerald-500" />
                <div className="text-left">
                  <span className="block font-black uppercase tracking-wider text-[11px]">Virtual Day Cycle</span>
                  <span className="text-[9px] text-zinc-400 font-medium block">Resets at {dayResetTime} daily</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black mono border border-emerald-500/20">
                {dayResetTime}
              </span>
            </button>
          </div>

          {/* Section 3: Preferences & Toggles */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
              Preferences & Controls
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Sound Chimes Toggle */}
              <button
                onClick={onToggleSound}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-left transition-colors"
              >
                <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'}`}>
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Audio Chimes
                  </span>
                  <span className="text-[8px] text-zinc-400 font-bold uppercase">
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </span>
                </div>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-left transition-colors"
              >
                <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Appearance
                  </span>
                  <span className="text-[8px] text-zinc-400 font-bold uppercase">
                    {theme === 'dark' ? 'Dark Canvas' : 'Light Canvas'}
                  </span>
                </div>
              </button>
            </div>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => {
                onOpenShortcuts();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                  <Command size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Keyboard Shortcuts</span>
              </div>
              <kbd className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-[10px] font-mono font-bold">
                ?
              </kbd>
            </button>
          </div>

          {/* Section 4: Data & Actions */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 px-1">
              Data & Sprint Actions
            </span>

            <div className="space-y-2">
              {/* Add Manual Session */}
              <button
                onClick={() => {
                  onOpenManualModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Add Session</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase">Manual Entry</span>
              </button>

              {/* Reset Active Block */}
              <button
                onClick={onResetBlock}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border font-bold text-xs transition-all ${
                  confirmReset
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {confirmReset ? <Check size={14} /> : <RotateCcw size={14} />}
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {confirmReset ? 'Click to Confirm Block Reset' : 'Reset Sprint Block'}
                  </span>
                </div>
                <span className="text-[9px] font-mono opacity-80">Keep logs safe</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={() => {
                  onExportCSV();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Download size={14} className="text-zinc-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Export Sessions (CSV)</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-mono">{sessionCount} records</span>
              </button>

              {/* Load Demo Data */}
              <button
                onClick={() => {
                  onLoadDemoData();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Load 14-Day Demo History</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">Sample Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Privacy note */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" /> 100% Client-Side Privacy
          </span>
          <span>Zero Trackers</span>
        </div>

      </div>

    </div>
  );
};

export default NavigationMenuModal;
