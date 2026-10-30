import { useCallback } from 'react';
import { router } from 'expo-router';
import { useToast } from '@/components/ui';
import { useAuthContext } from '@/context/auth-provider';

/**
 * Browsing is open to guests; acting (like, comment, cart, follow, message,
 * post) asks them to sign in — same rule as the web app's guest access.
 * Returns `guard(fn)`: runs fn when signed in, otherwise sends to sign-in.
 */
export function useRequireAuth() {
  const { isAuthenticated } = useAuthContext();
  const toast = useToast();

  const promptSignIn = useCallback(() => {
    toast.show('Sign in to continue.');
    router.push('/(auth)/login');
  }, [toast]);

  const guard = useCallback(
    <A extends unknown[]>(fn: (...args: A) => unknown) =>
      (...args: A) => {
        if (!isAuthenticated) return promptSignIn();
        return fn(...args);
      },
    [isAuthenticated, promptSignIn],
  );

  return { isAuthenticated, guard, promptSignIn };
}
