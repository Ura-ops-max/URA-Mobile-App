import { useSyncExternalStore } from 'react';
import type { AuthorType } from '@/types';

/**
 * Which identity the person is chatting as: themselves (User) or the shop they
 * own (Business) — the web chat page's Personal / Business tabs. Chat calls
 * read it; screens subscribe with `useActiveProfile()`.
 */
interface Session {
  profileId: string | null;
  model: AuthorType;
  paylukCustomerId: string | null;
}

let session: Session = { profileId: null, model: 'User', paylukCustomerId: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function setActiveProfile(profileId: string | null, model: AuthorType = 'User'): void {
  if (session.profileId === profileId && session.model === model) return;
  session = { ...session, profileId, model };
  emit();
}

export function setPaylukCustomerId(id: string | null): void {
  session = { ...session, paylukCustomerId: id };
}

export function getActiveProfile(): Session {
  return session;
}

export function getPaylukCustomerId(): string | null {
  return session.paylukCustomerId;
}

/** The active chat identity; re-renders when it changes. */
export function useActiveProfile(): Session {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => session,
    () => session,
  );
}
