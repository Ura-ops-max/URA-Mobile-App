import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_BASE_URL, GOOGLE_SIGN_IN_IOS, SITE_URL } from '@/constants/config';
import { captureOAuthToken } from '@/api/auth';
import { useAuthContext } from '@/context/auth-provider';

WebBrowser.maybeCompleteAuthSession();

/** Google sign-in is shown everywhere, unless turned off for iOS (GOOGLE_SIGN_IN_IOS=false). */
export const GOOGLE_SIGN_IN_AVAILABLE = Platform.OS !== 'ios' || GOOGLE_SIGN_IN_IOS;

const PENDING_KEY = 'ura_oauth_pending_at';
const PENDING_MAX_MS = 15 * 60 * 1000;

/**
 * Tokens arriving by link are accepted only if this app started a Google
 * sign-in in the last 15 minutes. Otherwise any website or message could sign
 * the app into someone else's account with a crafted ura://auth/oauth/success link.
 * Stored on the device so it survives Android closing the app during sign-in.
 */
async function markOAuthPending() {
  try {
    await AsyncStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the in-session result below still works */
  }
}

/** True (once) if a Google sign-in started in this app recently. */
export async function consumeOAuthPending(): Promise<boolean> {
  try {
    const at = Number(await AsyncStorage.getItem(PENDING_KEY));
    await AsyncStorage.removeItem(PENDING_KEY);
    return Number.isFinite(at) && at > 0 && Date.now() - at < PENDING_MAX_MS;
  } catch {
    return false;
  }
}

/** Pull the tokens (or the failure) out of the website URL the backend redirects to. */
export function parseOAuthRedirect(url: string): { accessToken: string; refreshToken: string } | { error: string } | null {
  try {
    const u = new URL(url);
    const accessToken = u.searchParams.get('accessToken');
    const refreshToken = u.searchParams.get('refreshToken');
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    const error = u.searchParams.get('error');
    return error ? { error } : null;
  } catch {
    return null;
  }
}

/**
 * Google sign-in, using the backend's own flow (GET /auth/google). The backend
 * always finishes on the website: {SITE_URL}/auth/oauth/success?accessToken&refreshToken
 * (or /auth/login?error=oauth_failed). The app catches that URL:
 *  - iOS: the auth session returns it (HTTPS callback; needs the Associated
 *    Domains entitlement `webcredentials:www.ura.com.ng` and the site's
 *    apple-app-site-association file);
 *  - Android: it opens the app through an App Link (needs the site's
 *    assetlinks.json) and lands on src/app/auth/oauth/success.tsx.
 */
export function useGoogleSignIn() {
  const { refetchAuth } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (): Promise<'success' | 'cancel' | 'failed'> => {
    setLoading(true);
    try {
      await markOAuthPending();
      const result = await WebBrowser.openAuthSessionAsync(`${API_BASE_URL}/auth/google`, SITE_URL, {
        preferUniversalLinks: true,
        // Keep Google's own sign-in cookie so people can pick their account quickly.
        preferEphemeralSession: false,
      });
      if (result.type !== 'success' || !result.url) {
        // Android: the App Link opens auth/oauth/success, which signs in and uses up
        // the pending marker, while this call only reports the browser closing.
        await new Promise((r) => setTimeout(r, 800));
        const stillPending = await AsyncStorage.getItem(PENDING_KEY).catch(() => null);
        if (!stillPending) return 'success';
        await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
        return 'cancel';
      }
      const parsed = parseOAuthRedirect(result.url);
      // The sign-in this call started has ended, whatever the outcome.
      if (!(await consumeOAuthPending())) return 'failed';
      if (!parsed || 'error' in parsed) return 'failed';
      await captureOAuthToken(parsed.accessToken, parsed.refreshToken);
      await refetchAuth();
      router.replace('/(tabs)/home');
      return 'success';
    } catch {
      return 'failed';
    } finally {
      setLoading(false);
    }
  }, [refetchAuth]);

  return { signIn, loading };
}
