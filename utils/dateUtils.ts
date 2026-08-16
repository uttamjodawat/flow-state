import { Session } from '../types';

/**
 * Parses "HH:MM" (e.g. "04:00", "00:00") into hour and minute numbers.
 */
export function parseResetTime(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr || !timeStr.includes(':')) {
    return { hours: 0, minutes: 0 };
  }
  const [h, m] = timeStr.split(':').map(Number);
  return {
    hours: isNaN(h) ? 0 : Math.max(0, Math.min(23, h)),
    minutes: isNaN(m) ? 0 : Math.max(0, Math.min(59, m)),
  };
}

/**
 * Returns the timestamp of the start of the virtual "day" for a given timestamp,
 * offset by the day reset time (e.g. 04:00 AM).
 */
export function getVirtualDayStart(timestamp: number, resetTimeStr: string = '00:00'): number {
  const { hours, minutes } = parseResetTime(resetTimeStr);
  const offsetMs = (hours * 60 + minutes) * 60 * 1000;
  
  // Shift timestamp back by offset, find midnight, then shift forward
  const shifted = new Date(timestamp - offsetMs);
  const midnight = new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate()).getTime();
  return midnight + offsetMs;
}

/**
 * Returns the end of the virtual day (start of next virtual day - 1ms).
 */
export function getVirtualDayEnd(timestamp: number, resetTimeStr: string = '00:00'): number {
  const dayStart = getVirtualDayStart(timestamp, resetTimeStr);
  return dayStart + 24 * 60 * 60 * 1000 - 1;
}

/**
 * Formats a virtual day key for grouping (e.g. "Aug 16, 2026")
 */
export function formatVirtualDayKey(timestamp: number, resetTimeStr: string = '00:00'): string {
  const dayStart = getVirtualDayStart(timestamp, resetTimeStr);
  return new Date(dayStart).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Filter sessions for a specific virtual day.
 */
export function getSessionsForVirtualDay(sessions: Session[], targetTimestamp: number, resetTimeStr: string = '00:00'): Session[] {
  const start = getVirtualDayStart(targetTimestamp, resetTimeStr);
  const end = start + 24 * 60 * 60 * 1000;
  return sessions.filter(s => s.startTime >= start && s.startTime < end);
}

/**
 * Formats milliseconds into human-readable duration strings.
 */
export function formatDuration(ms: number, short: boolean = false): string {
  if (!ms || ms <= 0) return short ? '0m' : '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (short) {
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Format timestamp into standard clock time (e.g. "04:15 PM")
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
