import { tokenStorage } from '@/lib/token-storage';
import API from '@/lib/axios-client';
import type {
  CurrentUserResponse,
  LoginResponse,
  RegisterResponse,
  UsernameCheckResponse,
  BusinessType,
} from '@/types';

export interface LoginInput {
  email: string; // email OR username
  password: string;
}
export interface RegisterInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
}

export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
  if (!username) return { available: true, message: '' };
  const { data } = await API.get('/auth/check-username', { params: { username } });
  return data;
}

export async function loginMutationFn(input: LoginInput): Promise<LoginResponse> {
  // Backend local strategy expects `identifier` (email OR username), not `email`.
  const { data } = await API.post('/auth/login', { identifier: input.email, password: input.password });
  if (data?.data?.accessToken) {
    await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
  }
  return data;
}

export async function registerMutationFn(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await API.post('/auth/register', input);
  return data;
}

export async function verifyEmailMutationFn(input: { email: string; token: string }) {
  // Backend: GET /auth/verify-email?token=
  const { data } = await API.get('/auth/verify-email', { params: { token: input.token } });
  return data;
}

/** Public resend (pre-login) — backend POST /auth/resend-verification { email }. */
export async function resendVerificationMutationFn(email: string) {
  const { data } = await API.post('/auth/resend-verification', { email });
  return data;
}

export async function forgotPasswordMutationFn(email: string) {
  const { data } = await API.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPasswordMutationFn(input: { token: string; password: string }) {
  const { data } = await API.post('/auth/reset-password', input);
  return data;
}

export async function logoutMutationFn() {
  const refreshToken = await tokenStorage.getRefreshToken();
  try {
    await API.post('/auth/logout', refreshToken ? { refreshToken } : {});
  } finally {
    await tokenStorage.clearTokens();
  }
  return { success: true };
}

/** Capture an OAuth deep-link token (Google success page). */
export async function captureOAuthToken(accessToken: string, refreshToken: string) {
  await tokenStorage.setTokens(accessToken, refreshToken);
}

/**
 * GET /users/me → { user, related: { business_id, businesses, counts } }. The
 * user document has no `business` field: a business owner's shop is
 * `related.businesses[0]`, so it is attached here as `user.business`.
 */
export async function getCurrentUserQueryFn(): Promise<CurrentUserResponse> {
  const { data } = await API.get('/users/me');
  const shop = (data?.related?.businesses?.[0] ?? null) as BusinessType | null;
  return { ...data, user: data?.user ? { ...data.user, business: shop } : data?.user };
}
