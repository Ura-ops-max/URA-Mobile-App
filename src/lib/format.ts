/** Formatting helpers shared across screens. */

/** Format a number as Nigerian Naira, e.g. 12500 -> "₦12,500". */
export function formatNaira(amount?: number | null): string {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/** Compact naira for small chips, e.g. 12500 -> "₦12.5k". */
export function formatNairaCompact(amount?: number | null): string {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}k`;
  return `₦${n}`;
}

/** Relative "time ago" string from an ISO date. */
export function timeAgo(input?: string | Date | null): string {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Compact count, e.g. 1500 -> "1.5k". */
export function formatCount(n?: number | null): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${v}`;
}

/** Initials from a display name. */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
