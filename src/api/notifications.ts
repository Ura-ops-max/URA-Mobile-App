import API from '@/lib/axios-client';
import type { Notification } from '@/types';

type Raw = Record<string, any>;

/** One raw notification (sender and relatedId populated) → the app's shape. */
export function mapNotification(n: Raw): Notification {
  const s = n.sender && typeof n.sender === 'object' ? n.sender : null;
  const senderName = s
    ? n.senderModel === 'Business' || s.businessName
      ? String(s.businessName ?? '')
      : `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || (s.username ?? '')
    : '';
  const rel = n.relatedId;
  const relatedId = rel && typeof rel === 'object' ? (rel._id ? String(rel._id) : null) : rel ? String(rel) : null;
  // Comment notices: the populated comment carries its post as `postId`.
  const postRef = rel && typeof rel === 'object' ? (rel.postId ?? rel.post) : null;
  const postId = postRef ? String(postRef?._id ?? postRef) : null;
  return {
    _id: String(n._id),
    type: String(n.type ?? 'SYSTEM'),
    actor: s ? { _id: String(s._id), name: senderName || 'Someone', avatar: s.businessLogo || s.profilePicture || null } : null,
    title: String(n.title ?? ''),
    text: String(n.summary || n.message || n.title || 'You have a new notification').trim(),
    read: !!n.isRead,
    createdAt: n.createdAt,
    modelType: n.modelType ?? null,
    relatedId,
    postId,
    recipientId: n.recipient ? String(n.recipient?._id ?? n.recipient) : null,
  };
}

/** Where tapping a notification goes (web lib/notification-link + the other models). */
export function notificationRoute(
  n: Pick<Notification, 'modelType' | 'relatedId' | 'postId' | 'title'>,
): string | null {
  // Message notices point at a conversation the server can't populate: open Chats.
  if (n.title === 'New Message') return '/(tabs)/chat';
  // Sent on converting to a business; the server labels it 'Order' with the shop's id.
  if (n.title === 'Welcome Business Owner!') return '/settings/business';
  if (!n.relatedId) return null;
  switch (n.modelType) {
    case 'Order':
      return `/order/${n.relatedId}`;
    case 'Post':
      return `/post/${n.relatedId}`;
    case 'Product':
      return `/product/${n.relatedId}`;
    case 'Business':
      return `/business/${n.relatedId}`;
    case 'User':
      return `/user/${n.relatedId}`;
    case 'Comment':
      return n.postId ? `/post/${n.postId}` : null;
    default:
      return null;
  }
}

/** GET /logs/notifications → a raw array (newest first). */
export async function getNotifications(): Promise<Notification[]> {
  const { data } = await API.get('/logs/notifications');
  const rows: Raw[] = Array.isArray(data) ? data : (data?.data ?? []);
  return rows.map(mapNotification);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await API.get('/logs/notifications/unread-count');
  return Number(data?.count) || 0;
}

export async function markNotificationRead(id: string) {
  await API.patch(`/logs/notifications/mark-read/${id}`);
}

export async function markAllRead() {
  await API.patch('/logs/notifications/mark-read');
}

export async function deleteNotification(id: string) {
  await API.delete(`/logs/notifications/${id}`);
}

export async function clearAllNotifications() {
  await API.delete('/logs/notifications/clear-all');
}
