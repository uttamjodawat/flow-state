import { SessionMode } from './types';

export const MODE_COLORS = {
  [SessionMode.FOCUSED]: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    canvas: '#10b981',
    border: 'border-emerald-500/20',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600',
    accent: '#10b981'
  },
  [SessionMode.DISTRACTED]: {
    bg: 'bg-rose-500',
    text: 'text-rose-500',
    canvas: '#f43f5e',
    border: 'border-rose-500/20',
    hover: 'hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600',
    accent: '#f43f5e'
  },
  [SessionMode.REST]: {
    bg: 'bg-sky-500',
    text: 'text-sky-500',
    canvas: '#0ea5e9',
    border: 'border-sky-500/20',
    hover: 'hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600',
    accent: '#0ea5e9'
  },
  [SessionMode.IDLE]: {
    bg: 'bg-zinc-400',
    text: 'text-zinc-400',
    canvas: '#a1a1aa',
    border: 'border-zinc-400/20',
    hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    accent: '#a1a1aa'
  }
};

export const SESSION_STORAGE_KEY = 'flowstate_sessions';
export const THEME_STORAGE_KEY = 'flowstate_theme';
export const RESET_STORAGE_KEY = 'flowstate_last_reset';
export const DAY_RESET_TIME_STORAGE_KEY = 'flowstate_day_reset_time';
export const RECENT_INTENTS_STORAGE_KEY = 'flowstate_recent_intents';
export const SOUND_ENABLED_STORAGE_KEY = 'flowstate_sound_enabled';

export const DAY_RESET_PRESETS = [
  { label: 'Midnight', time: '00:00', desc: 'Standard 12:00 AM reset' },
  { label: 'Night Owl', time: '04:00', desc: '4:00 AM (keeps late night in same day)' },
  { label: 'Early Bird', time: '06:00', desc: '6:00 AM (starts with dawn)' },
  { label: 'Workday', time: '08:30', desc: '8:30 AM (aligned with morning routine)' },
];

export const DISTRACTION_TAGS = [
  '📱 Social Media',
  '🔔 Notification',
  '💬 Slack / Chat',
  '📧 Checked Email',
  '☕ Energy Dip / Fatigue',
  '🧠 Thought Tangent',
  '📞 Call / Meeting',
  '🌐 Random Browsing',
];
