import type { ConfigContext, ExpoConfig } from 'expo/config';
import base from './app.json';

/**
 * Dynamic Expo config: everything static lives in app.json; runtime settings are
 * injected into `extra` and read via expo-constants (src/constants/config.ts).
 *
 * Values come from the environment (.env locally, eas.json `env` on EAS Build).
 * Defaults are the PRODUCTION values the web app uses, so a build can never
 * silently point at localhost if an env var is missing (.env is gitignored and
 * is not uploaded to EAS).
 */
const PROD = {
  apiRootUrl: 'https://api.ura.com.ng',
  aiSearchBaseUrl: 'https://1f56j28jcc.execute-api.eu-west-1.amazonaws.com/Stage',
  siteUrl: 'https://www.ura.com.ng',
  // Publishable (client-side) key — the same one the web app ships to browsers.
  paylukPublicKey: 'pk_live_pEjLgxvzsed6mQ800p50HiY6fmFX7vTJ',
  supportEmail: 'info@ura.com.ng',
  supportPhone: '+2348152345755',
};

const env = (name: string): string | undefined => {
  const v = process.env[name] ?? process.env[`EXPO_PUBLIC_${name}`];
  return v && v.trim() ? v.trim() : undefined;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiRootUrl = env('API_ROOT_URL') ?? PROD.apiRootUrl;
  const staticConfig = base.expo as ExpoConfig;
  return {
    ...staticConfig,
    ...config,
    extra: {
      ...staticConfig.extra,
      ...config.extra,
      apiRootUrl,
      apiBaseUrl: env('API_BASE_URL') ?? `${apiRootUrl}/api/v1`,
      // Empty string disables the external AI Lambda (text search then uses /search).
      aiSearchBaseUrl: process.env.AI_SEARCH_BASE_URL !== undefined ? process.env.AI_SEARCH_BASE_URL.trim() : PROD.aiSearchBaseUrl,
      siteUrl: env('SITE_URL') ?? PROD.siteUrl,
      paylukPublicKey: env('PAYLUK_PUBLIC_KEY') ?? PROD.paylukPublicKey,
      supportEmail: env('SUPPORT_EMAIL') ?? PROD.supportEmail,
      supportPhone: env('SUPPORT_PHONE') ?? PROD.supportPhone,
      // Google sign-in on iOS. On by default (owner's decision). App Store guideline 4.8
      // expects an equivalent option (Sign in with Apple) when Google sign-in is
      // offered; set GOOGLE_SIGN_IN_IOS=false to hide it for an App Store review.
      googleSignInIos: env('GOOGLE_SIGN_IN_IOS') !== 'false',
      // Set by `eas init` (EAS_PROJECT_ID) — required for EAS Build/Update.
      ...(env('EAS_PROJECT_ID') ? { eas: { projectId: env('EAS_PROJECT_ID') } } : {}),
    },
  };
};
