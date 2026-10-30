import { io, type Socket } from 'socket.io-client';
import { API_ROOT_URL, SITE_URL } from '@/constants/config';
import { tokenStorage } from './token-storage';

/**
 * Socket.IO client — mirrors the web `services/socket.service.ts`.
 *
 * The server (services/socket.service.ts) requires:
 *  - the login token on every connection (`auth.token`), checked again on reconnect;
 *  - an allowed Origin. React Native's WebSocket sends the API host as Origin
 *    by default, which the server refuses, so the app sends URA's site origin.
 * Then `setup` (own user id or an owned shop id; else `setup_denied`) and
 * `join_chat` (conversations the user is in; else `join_chat_denied`).
 * Server events: `notification_received`, `new_notification`, `message:received`,
 * `messages_seen`, `user_status_changed`, `connected`.
 */
class SocketService {
  private socket: Socket | null = null;
  /** Personal rooms to join: the user, and the shop they own (both inboxes stay live). */
  private profileIds: string[] = [];

  connect(): Socket {
    if (this.socket) return this.socket;
    this.socket = io(API_ROOT_URL, {
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: true,
      // A function, so every (re)connect sends the current, refreshed token.
      auth: (cb) => {
        void tokenStorage.getToken().then((token) => cb({ token: token ?? '' }));
      },
      extraHeaders: { Origin: SITE_URL },
    });
    this.socket.on('connect', () => {
      for (const id of this.profileIds) this.socket?.emit('setup', id);
    });
    this.socket.on('connect_error', (err) => {
      if (__DEV__) console.warn('[socket] connect error:', err.message);
    });
    this.socket.on('setup_denied', () => {
      if (__DEV__) console.warn('[socket] setup denied for', this.profileIds);
    });
    return this.socket;
  }

  setup(profileIds: string[]): void {
    this.profileIds = [...new Set(profileIds.filter(Boolean))];
    const s = this.connect();
    if (s.connected) for (const id of this.profileIds) s.emit('setup', id);
  }

  joinChat(conversationId: string): void {
    this.socket?.emit('join_chat', conversationId);
  }

  on(event: string, cb: (data: unknown) => void): void {
    this.socket?.on(event, cb);
  }

  off(event: string, cb?: (data: unknown) => void): void {
    this.socket?.off(event, cb);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.profileIds = [];
  }
}

export const socketService = new SocketService();
