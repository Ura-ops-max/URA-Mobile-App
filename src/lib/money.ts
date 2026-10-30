// Formatting helpers that never throw (web lib/money.ts). A bad currency code
// (Payluk sometimes sends "NG") or a missing date must not crash the wallet.

export const toCurrencyCode = (c: unknown): string => {
  const v = String(c ?? '').trim().toUpperCase();
  if (v === 'NG' || v === 'NAIRA' || v === '₦') return 'NGN';
  return /^[A-Z]{3}$/.test(v) ? v : 'NGN';
};

export function formatMoney(amount: unknown, currency: unknown = 'NGN'): string {
  const n = Number(amount) || 0;
  const code = toCurrencyCode(currency);
  const digits = n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return code === 'NGN' ? `₦${digits}` : `${code} ${digits}`;
}

/** A Date, or null when the value isn't a usable date. */
export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  // Payluk sends some times as Unix seconds in a string ("1782373118").
  const d =
    typeof value === 'string' && /^\d{9,11}$/.test(value)
      ? new Date(Number(value) * 1000)
      : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "05 Mar 2026 · 3:04 PM", or '' for a bad date. */
export function formatDateTime(value: unknown, withYear = true): string {
  const d = toDate(value);
  if (!d) return '';
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const day = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
  return `${day} · ${time}`;
}
