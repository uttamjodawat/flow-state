import { Session, SessionMode } from '../types';

export function generateDemoSessions(): Session[] {
  const sessions: Session[] = [];
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const missions = [
    'Refactor core authentication engine',
    'Design design system tokens',
    'Review PR & write unit tests',
    'Draft quarterly product strategy',
    'Client architecture sync notes',
    'Fix memory leak in timeline canvas',
    'Deep focus: API documentation',
    'Customer feedback synthesis',
  ];

  const reflections = [
    'Got distracted by sudden Slack ping',
    'Fell into Wikipedia rabbit hole',
    'Checked email prematurely',
    'Context switch due to meeting alert',
    'Energy dipped; needed quick stretch',
  ];

  // Generate for past 14 days
  for (let d = 13; d >= 0; d--) {
    const dayBase = now - d * DAY_MS;
    const baseDate = new Date(dayBase);
    baseDate.setHours(9, 0, 0, 0);

    let currentTime = baseDate.getTime();
    const isWeekend = baseDate.getDay() === 0 || baseDate.getDay() === 6;
    const sessionCount = isWeekend ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 5) + 4;

    for (let s = 0; s < sessionCount; s++) {
      // 70% Focus, 15% Rest, 15% Distraction
      const rand = Math.random();
      let mode = SessionMode.FOCUSED;
      let duration = (Math.floor(Math.random() * 40) + 25) * 60 * 1000; // 25 - 65 min
      let intent = missions[Math.floor(Math.random() * missions.length)];
      let reflection: string | undefined = undefined;

      if (rand > 0.85) {
        mode = SessionMode.DISTRACTED;
        duration = (Math.floor(Math.random() * 12) + 5) * 60 * 1000; // 5 - 17 min
        reflection = reflections[Math.floor(Math.random() * reflections.length)];
      } else if (rand > 0.70) {
        mode = SessionMode.REST;
        duration = (Math.floor(Math.random() * 15) + 5) * 60 * 1000; // 5 - 20 min
        intent = 'Rest & Hydration';
      }

      sessions.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `demo-${d}-${s}-${Math.random()}`,
        mode,
        startTime: currentTime,
        endTime: currentTime + duration,
        duration,
        intent: mode !== SessionMode.REST ? intent : undefined,
        reflection,
      });

      // Gap before next session (5 to 30 mins)
      currentTime += duration + (Math.floor(Math.random() * 20) + 5) * 60 * 1000;
    }
  }

  return sessions.sort((a, b) => b.startTime - a.startTime);
}
