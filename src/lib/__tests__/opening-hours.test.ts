import { shopOpenState, toMinutes } from '@/lib/opening-hours';

// Lagos is UTC+1. 2026-10-26 is a Monday.
const at = (isoUtc: string) => new Date(isoUtc);
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => ({ day, open: '09:00', close: '17:00' }));

describe('shopOpenState (checkout is blocked while a shop is closed)', () => {
  it('never blocks without hours', () => {
    expect(shopOpenState(undefined).open).toBe(true);
    expect(shopOpenState([]).open).toBe(true);
  });

  it('is open during Lagos hours', () => {
    // 10:00 Lagos = 09:00 UTC
    expect(shopOpenState(weekdays, at('2026-10-26T09:00:00Z')).open).toBe(true);
  });

  it('is closed before opening and says when it opens', () => {
    // 07:30 Lagos
    expect(shopOpenState(weekdays, at('2026-10-26T06:30:00Z'))).toEqual({ open: false, opensLabel: 'Opens today at 9:00' });
  });

  it('skips to the next open day at the weekend', () => {
    // The shop form saves all seven days, with "Closed" for days off.
    const week = [...weekdays, { day: 'Saturday', open: 'Closed', close: 'Closed' }, { day: 'Sunday', open: 'Closed', close: 'Closed' }];
    // Saturday 2026-10-31 12:00 Lagos
    expect(shopOpenState(week, at('2026-10-31T11:00:00Z'))).toEqual({ open: false, opensLabel: 'Opens Monday at 9:00' });
  });

  it('does not block on a day missing from the hours (same as the web)', () => {
    expect(shopOpenState(weekdays, at('2026-10-31T11:00:00Z')).open).toBe(true);
  });

  it('handles hours past midnight', () => {
    const late = [{ day: 'Monday', open: '18:00', close: '02:00' }, { day: 'Tuesday', open: 'Closed', close: 'Closed' }];
    // Tuesday 01:00 Lagos is still Monday's shift
    expect(shopOpenState(late, at('2026-10-27T00:00:00Z')).open).toBe(true);
  });
});

it('reads 12/24-hour times', () => {
  expect(toMinutes('09:30')).toBe(570);
  expect(toMinutes('9:30 PM')).toBe(1290);
  expect(toMinutes('12:00 AM')).toBe(0);
  expect(toMinutes('Closed')).toBeNull();
});
