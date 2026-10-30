// Report and block for user-generated content (App Store guideline 1.2,
// Google Play UGC policy). The backend has no report/block endpoint yet, so:
//  - Report opens an email to URA support with the content's details;
//  - Block hides that author's posts on this device, at once.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { useSyncExternalStore } from 'react';
import { SUPPORT_EMAIL } from '@/constants/config';

const KEY = 'ura_blocked_authors';
let blocked = new Set<string>();
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) blocked = new Set(JSON.parse(raw) as string[]);
    emit();
  } catch {
    /* storage unavailable: start empty */
  }
}
void load();

async function save() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...blocked]));
  } catch {
    /* ignore */
  }
}

export function blockAuthor(authorId: string) {
  blocked = new Set(blocked).add(authorId);
  emit();
  void save();
}

export function unblockAuthor(authorId: string) {
  const next = new Set(blocked);
  next.delete(authorId);
  blocked = next;
  emit();
  void save();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The set of author ids this person has blocked (re-renders on change). */
export function useBlockedAuthors(): Set<string> {
  return useSyncExternalStore(subscribe, () => blocked, () => blocked);
}

/** Opens an email to URA support reporting a post, product, profile or message. */
export async function reportContent(input: {
  kind: 'post' | 'product' | 'profile' | 'message' | 'review' | 'comment';
  id: string;
  authorName?: string;
  authorId?: string;
  reporterId?: string;
}): Promise<boolean> {
  const subject = `Report: ${input.kind} ${input.id}`;
  const body = [
    `I want to report this ${input.kind} on URA.`,
    '',
    `${input.kind} id: ${input.id}`,
    input.authorName ? `Posted by: ${input.authorName}${input.authorId ? ` (${input.authorId})` : ''}` : '',
    input.reporterId ? `Reported by user: ${input.reporterId}` : '',
    '',
    'Reason:',
    '',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
