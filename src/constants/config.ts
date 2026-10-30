import Constants from 'expo-constants';

/**
 * Runtime configuration. Values are injected by app.config.ts into `extra`
 * (from .env locally / eas.json on EAS Build) and default to production.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  apiRootUrl?: string;
  aiSearchBaseUrl?: string;
  siteUrl?: string;
  paylukPublicKey?: string;
  supportEmail?: string;
  supportPhone?: string;
  googleSignInIos?: boolean;
};

/**
 * The dev machine's LAN host, derived from the Expo/Metro host (e.g. "192.168.1.5:8081").
 * On a physical device "localhost" points at the device itself, so localhost URLs
 * are rewritten to the machine serving the app. No effect on real domains.
 */
function devHost(): string | null {
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
}

function resolveHost(url: string): string {
  const host = devHost();
  if (!host) return url;
  return url.replace(/(https?:\/\/)(localhost|127\.0\.0\.1)/, `$1${host}`);
}

/** Express backend base (routes mounted under /api/v1). Mirrors `VITE_API_BASE_URL`. */
export const API_BASE_URL = resolveHost(extra.apiBaseUrl ?? 'https://api.ura.com.ng/api/v1');

/** Socket.IO root (no /api/v1). Mirrors `VITE_API_ROOT_URL`. */
export const API_ROOT_URL = resolveHost(extra.apiRootUrl ?? API_BASE_URL.replace(/\/api\/v1\/?$/, ''));

/** External AI search Lambda. Empty = use the in-house /search. Mirrors `VITE_AI_SEARCH_BASE_URL`. */
// The app calls `${base}/search`; accept the base with or without that suffix.
export const AI_SEARCH_BASE_URL = (extra.aiSearchBaseUrl ?? '').replace(/\/+$/, '').replace(/\/search$/, '');

/** Public website (business pages live at {SITE_URL}/<slug>). Mirrors `VITE_SITE_URL`. */
export const SITE_URL = (extra.siteUrl ?? 'https://www.ura.com.ng').replace(/\/$/, '');

/** Payluk publishable key for card checkout. Mirrors `VITE_PAYLUK_PUBLIC_KEY`. */
export const PAYLUK_PUBLIC_KEY = extra.paylukPublicKey ?? '';

/** Payluk checkout hosts — live keys use live hosts, test keys use staging. */
export const PAYLUK_CHECKOUT_API = PAYLUK_PUBLIC_KEY.startsWith('pk_live_')
  ? 'https://live.payluk.ng'
  : 'https://staging.live.payluk.ng';
export const PAYLUK_WIDGET_SCRIPT = 'https://checkout.payluk.ng/escrow-checkout.min.js';

export const SUPPORT_EMAIL = extra.supportEmail ?? 'info@ura.com.ng';
export const SUPPORT_PHONE = extra.supportPhone ?? '+2348152345755';

/** Show Google sign-in on iOS (default on; other platforms always show it). See app.config.ts. */
export const GOOGLE_SIGN_IN_IOS = extra.googleSignInIos !== false;

export const APP_NAME = 'URA';
