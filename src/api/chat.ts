import API from '@/lib/axios-client';
import type { AuthorType, Conversation, Message } from '@/types';
import { getActiveProfile } from '@/lib/active-profile';

type Raw = Record<string, any>;

const idOf = (v: unknown) => (v && typeof v === 'object' ? String((v as Raw)._id ?? '') : String(v ?? ''));

function nameOf(p: Raw | null, model?: string): string {
  if (!p) return 'URA user';
  if (model === 'Business' || p.businessName) return String(p.businessName || 'Business');
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'URA user';
}

/**
 * A conversation from GET /conversations (participants.participantId and
 * lastMessage populated; unreadCount is a { profileId: n } map) → the other
 * person, the last message and my unread count.
 */
export function mapConversation(c: Raw, myProfileId: string | null): Conversation {
  const parts: Raw[] = Array.isArray(c.participants) ? c.participants : [];
  const other = parts.find((p) => idOf(p.participantId) !== myProfileId) ?? parts[0] ?? {};
  const person = other.participantId && typeof other.participantId === 'object' ? other.participantId : null;
  const model: AuthorType = other.participantModel === 'Business' ? 'Business' : 'User';
  const last = c.lastMessage && typeof c.lastMessage === 'object' ? c.lastMessage : null;
  const unread = c.unreadCount && myProfileId ? Number(c.unreadCount[myProfileId]) || 0 : 0;
  return {
    _id: String(c._id),
    participant: {
      _id: idOf(other.participantId),
      name: nameOf(person, model),
      avatar: (model === 'Business' ? person?.businessLogo : person?.profilePicture) || null,
      model,
    },
    lastMessage: last ? String(last.content ?? '') || (last.media?.length ? 'Photo' : '') : '',
    lastMessageAt: last?.createdAt ?? c.updatedAt,
    unreadCount: unread,
  };
}

/** A message (sender populated) from GET messages / POST / the socket. */
export function mapMessage(m: Raw): Message {
  return {
    _id: String(m._id),
    conversationId: idOf(m.conversation),
    content: String(m.content ?? ''),
    senderId: idOf(m.sender),
    senderModel: m.senderModel === 'Business' ? 'Business' : 'User',
    createdAt: m.createdAt,
  };
}

/** Conversations of a profile (the person or their shop). Defaults to the active chat identity. */
export async function getConversations(profileId: string | null = getActiveProfile().profileId): Promise<Conversation[]> {
  if (!profileId) return [];
  const { data } = await API.get('/conversations', { params: { profileId } });
  return (Array.isArray(data?.data) ? data.data : []).map((c: Raw) => mapConversation(c, profileId));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { profileId } = getActiveProfile();
  const { data } = await API.get(`/conversations/${conversationId}/messages`, { params: { profileId } });
  return (Array.isArray(data?.data) ? data.data : []).map(mapMessage);
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { profileId, model } = getActiveProfile();
  const { data } = await API.post('/conversations/messages', {
    conversationId,
    content,
    senderId: profileId,
    senderModel: model,
  });
  return mapMessage(data.data);
}

/** Open (or create) a conversation with someone. POST /conversations → { data: conversation }. */
export async function accessConversation(
  receiverId: string,
  _receiverName: string,
  _avatar: string | null,
  receiverModel: AuthorType = 'User',
  /** Who starts the chat. Defaults to the active chat identity. */
  sender: { profileId: string | null; model: AuthorType } = getActiveProfile(),
): Promise<Conversation> {
  const { profileId, model } = sender;
  const { data } = await API.post('/conversations', {
    senderId: profileId,
    senderModel: model,
    receiverId,
    receiverModel,
  });
  return mapConversation(data.data, profileId);
}

export async function markConversationRead(_conversationId: string) {
  // GET messages marks the conversation read on the server (and emits messages_seen).
}

export interface ChatContact {
  _id: string;
  name: string;
  avatar: string | null;
  username: string;
  model: AuthorType;
}

/**
 * People (and shops) to start a chat with: who `profileId` follows, or its
 * followers. GET /users/:id/social?type= → { users: [{ _id, firstName, lastName, username, avatar, isBusiness }] }.
 */
export async function getChatContacts(profileId: string, type: 'following' | 'followers'): Promise<ChatContact[]> {
  const { data } = await API.get(`/users/${profileId}/social`, { params: { type } });
  return (data.users ?? []).map(
    (u: { _id: string; firstName?: string; lastName?: string; username?: string; avatar?: string | null; isBusiness?: boolean }) => ({
      _id: u._id,
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'User',
      avatar: u.avatar ?? null,
      username: u.isBusiness ? 'Business' : `@${u.username ?? ''}`,
      model: u.isBusiness ? 'Business' : 'User',
    }),
  );
}
