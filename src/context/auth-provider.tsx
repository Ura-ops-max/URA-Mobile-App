import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUserQueryFn,
  loginMutationFn,
  logoutMutationFn,
  type LoginInput,
} from '@/api/auth';
import { setOnAuthFailure } from '@/lib/axios-client';
import { tokenStorage } from '@/lib/token-storage';
import { setActiveProfile, setPaylukCustomerId } from '@/lib/active-profile';
import type { CurrentUserResponse, UserType } from '@/types';

interface AuthContextValue {
  user?: UserType;
  data?: CurrentUserResponse;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFetching: boolean;
  login: (input: LoginInput) => Promise<void>;
  isLoggingIn: boolean;
  logout: () => void;
  isLoggingOut: boolean;
  refetchAuth: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  // Warm the token cache from secure storage before the first authed request.
  useEffect(() => {
    tokenStorage.hydrate().finally(() => setHydrated(true));
    setOnAuthFailure(() => {
      // Session ended: drop every cached query (orders, chats, wallet...) so the
      // next account to sign in on this device never sees the previous one's data.
      queryClient.clear();
      queryClient.setQueryData(['auth', 'me'], undefined);
      router.replace('/(auth)/login');
    });
  }, [queryClient]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUserQueryFn,
    retry: false,
    enabled: hydrated,
  });

  // Keep the active chat/socket profile in sync (personal profile by default).
  useEffect(() => {
    if (data?.user?._id) {
      setActiveProfile(data.user._id, 'User');
      setPaylukCustomerId(data.user.paylukCustomerId ?? null);
    } else {
      setActiveProfile(null, 'User');
      setPaylukCustomerId(null);
    }
  }, [data?.user?._id, data?.user?.paylukCustomerId]);

  const loginMut = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const logoutMut = useMutation({
    mutationFn: logoutMutationFn,
    // Settled, not just success: the tokens are always deleted (logoutMutationFn's
    // `finally`), so the cached account data must go too even when the server call
    // fails (offline), or the next person to sign in could see it.
    onSettled: () => {
      queryClient.setQueryData(['auth', 'me'], undefined);
      queryClient.clear();
    },
  });

  const value: AuthContextValue = {
    user: data?.user,
    data,
    isAuthenticated: !!data?.user,
    isLoading: !hydrated || isLoading,
    isFetching,
    login: async (input) => {
      await loginMut.mutateAsync(input);
    },
    isLoggingIn: loginMut.isPending,
    logout: () => logoutMut.mutate(),
    isLoggingOut: logoutMut.isPending,
    refetchAuth: () => refetch(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
