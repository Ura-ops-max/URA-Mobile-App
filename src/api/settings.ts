import API from '@/lib/axios-client';
import type { ActivityLog } from '@/types';

export async function updatePassword(input: { currentPassword: string; newPassword: string }) {
  const { data } = await API.put('/settings/password', input);
  return data;
}

export async function updateEmail(input: { email: string; password: string }) {
  const { data } = await API.put('/settings/email', input);
  return data;
}

export async function resendVerification() {
  const { data } = await API.post('/settings/resend-verification');
  return data;
}

export async function toggleTwoFactor(enabled: boolean) {
  const { data } = await API.post(`/auth/2fa/${enabled ? 'enable' : 'disable'}`);
  return data;
}

/** GET /logs/activities → raw array [{ _id, action, description, metadata:{ ip, userAgent, device, location } }]. */
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const { data } = await API.get('/logs/activities');
  const rows: Record<string, any>[] = Array.isArray(data) ? data : (data?.data ?? []);
  return rows.map((a) => ({
    _id: String(a._id),
    action: String(a.action ?? '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase()),
    detail: String(a.description ?? ''),
    ip: a.metadata?.ip ?? undefined,
    device: a.metadata?.device ?? undefined,
    location: a.metadata?.location ?? undefined,
    createdAt: a.createdAt,
  }));
}

export async function clearActivityLogs() {
  await API.delete('/logs/activities/clear-all');
  return { success: true };
}
