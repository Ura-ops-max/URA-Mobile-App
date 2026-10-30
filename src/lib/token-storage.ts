import * as SecureStore from 'expo-secure-store';

/**
 * Secure token storage (expo-secure-store: Keychain on iOS, Keystore on Android).
 * Mirrors the web `tokenStorage` surface; a sync in-memory cache backs the axios
 * request interceptor so it doesn't await on every call.
 */

const ACCESS_KEY = 'ura_access_token';
const REFRESH_KEY = 'ura_refresh_token';

let accessCache: string | null = null;
let refreshCache: string | null = null;

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (accessCache) return accessCache;
    accessCache = await SecureStore.getItemAsync(ACCESS_KEY);
    return accessCache;
  },
  getTokenSync(): string | null {
    return accessCache;
  },
  async setToken(token: string): Promise<void> {
    accessCache = token;
    await SecureStore.setItemAsync(ACCESS_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    if (refreshCache) return refreshCache;
    refreshCache = await SecureStore.getItemAsync(REFRESH_KEY);
    return refreshCache;
  },
  async setRefreshToken(token: string): Promise<void> {
    refreshCache = token;
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    accessCache = access;
    refreshCache = refresh;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },
  async clearTokens(): Promise<void> {
    accessCache = null;
    refreshCache = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
  /** Warm the sync caches at app start so the request interceptor has tokens. */
  async hydrate(): Promise<void> {
    accessCache = await SecureStore.getItemAsync(ACCESS_KEY);
    refreshCache = await SecureStore.getItemAsync(REFRESH_KEY);
  },
};
