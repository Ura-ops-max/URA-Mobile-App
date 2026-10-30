// Is a shop open right now (Nigerian time), and when does it open next?
// Ported from the web app's lib/opening-hours.ts. Hours look like
// { day: 'Monday', open: '09:00', close: '18:00', isClosed }.
// Missing or unreadable hours never block anyone.

export interface OpeningHour {
  day?: string;
  open?: string;
  close?: string;
  isClosed?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Lagos is UTC+1 all year (no daylight saving), so no Intl time-zone data is needed. */
export function lagosClock(now: Date): { day: number; minutes: number } {
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  return { day: lagos.getUTCDay(), minutes: lagos.getUTCHours() * 60 + lagos.getUTCMinutes() };
}

/** "09:00" / "9:00" / "9:00 AM" → minutes, or null. */
export function toMinutes(t: unknown): number | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*$/i.exec(String(t ?? ''));
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) {
    const pm = m[3].toLowerCase() === 'pm';
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  return h < 24 && min < 60 ? h * 60 + min : null;
}

const label = (minutes: number) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

const hoursFor = (hours: OpeningHour[], day: number) =>
  hours.find((h) => String(h?.day ?? '').toLowerCase() === DAYS[day].toLowerCase());

const isClosedDay = (h: OpeningHour | undefined) =>
  !h || h.isClosed === true || String(h.open ?? '').toLowerCase() === 'closed';

export interface ShopOpenState {
  open: boolean;
  /** e.g. "Opens today at 9:00", "Opens tomorrow at 9:00", "Opens Monday at 9:00". */
  opensLabel: string | null;
}

export function shopOpenState(hours: OpeningHour[] | undefined | null, now = new Date()): ShopOpenState {
  const list = Array.isArray(hours) ? hours.filter(Boolean) : [];
  if (list.length === 0) return { open: true, opensLabel: null };

  const { day, minutes } = lagosClock(now);
  const today = hoursFor(list, day);
  const yesterday = hoursFor(list, (day + 6) % 7);

  // Open now by yesterday's hours running past midnight (e.g. 18:00 to 02:00)?
  if (!isClosedDay(yesterday)) {
    const o = toMinutes(yesterday!.open);
    const c = toMinutes(yesterday!.close);
    if (o !== null && c !== null && c < o && minutes < c) return { open: true, opensLabel: null };
  }

  if (!today) return { open: true, opensLabel: null };

  if (!isClosedDay(today)) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (o === null || c === null) return { open: true, opensLabel: null };
    const openNow = c > o ? minutes >= o && minutes < c : minutes >= o || minutes < c;
    if (openNow) return { open: true, opensLabel: null };
    if (minutes < o) return { open: false, opensLabel: `Opens today at ${label(o)}` };
  }

  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const h = hoursFor(list, d);
    if (isClosedDay(h)) continue;
    const o = toMinutes(h!.open);
    if (o === null) continue;
    return { open: false, opensLabel: `Opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${label(o)}` };
  }
  return { open: false, opensLabel: null };
}
