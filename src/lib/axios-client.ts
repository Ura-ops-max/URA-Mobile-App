import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AI_SEARCH_BASE_URL, API_BASE_URL } from '@/constants/config';
import { tokenStorage } from './token-storage';

/**
 * Real backend clients. Mirrors the web `lib/axios-client.ts`: attaches the
 * bearer token, and on 401 refreshes via POST /auth/refresh, queuing concurrent
 * requests, retrying them, and logging out on refresh failure.
 */

export const API = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

/** Registered by the auth layer; invoked when the session can't be refreshed. */
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(fn: () => void) {
  onAuthFailure = fn;
}

API.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getTokenSync() ?? (await tokenStorage.getToken());
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

const flushQueue = (error: unknown, token: string | null) => {
  queue.forEach((p) => (error || !token ? p.reject(error) : p.resolve(token)));
  queue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!error.response || !original) return Promise.reject(error);

    const url = original.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response.status === 401 && !isAuthCall && !original._retry) {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        // A guest (no session at all) just gets the 401; only a lost session signs out.
        const hadSession = !!original.headers?.Authorization;
        await tokenStorage.clearTokens();
        if (hadSession) onAuthFailure?.();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data?.data ?? data;
        await tokenStorage.setToken(accessToken);
        if (newRefresh) await tokenStorage.setRefreshToken(newRefresh);
        flushQueue(null, accessToken);
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
        return API(original);
      } catch (refreshErr) {
        flushQueue(refreshErr, null);
        // Sign out only when the server rejected the refresh token (401 "Invalid or
        // expired refresh token", or 400/403). A dropped connection or a server error
        // keeps the session so the next request can refresh again.
        const status = (refreshErr as AxiosError).response?.status;
        if (status === 400 || status === 401 || status === 403) {
          await tokenStorage.clearTokens();
          onAuthFailure?.();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/** External AI search Lambda client (no auth header — public Lambda). */
export const aiSearchAPI = axios.create({ baseURL: AI_SEARCH_BASE_URL, timeout: 15000 });

export default API;
