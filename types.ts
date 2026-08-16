export enum SessionMode {
  FOCUSED = 'FOCUSED',
  DISTRACTED = 'DISTRACTED',
  REST = 'REST',
  IDLE = 'IDLE'
}

export interface Session {
  id: string;
  mode: SessionMode;
  startTime: number;
  endTime?: number;
  duration?: number; // in milliseconds
  intent?: string;   // What the user planned to do
  reflection?: string; // What actually happened or how they felt
  tag?: string;
}

export interface DailyStats {
  totalSessions: number;
  modeStats: Record<SessionMode, {
    count: number;
    totalDuration: number;
    minDuration: number;
    maxDuration: number;
    avgDuration: number;
  }>;
}

export type Theme = 'light' | 'dark';

export type ActiveTab = 'timer' | 'analytics' | 'history';

export type TimeRangeFilter = 'day' | 'week' | 'month' | 'all';
