import { type ReactNode } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const isNetworkError = (e: unknown) =>
  !!e && typeof e === 'object' && 'message' in e && (e as { message?: string }).message === 'Network Error';

const statusOf = (e: unknown): number | undefined =>
  (e as { response?: { status?: number } })?.response?.status;

/** Errors we don't retry and don't log — expected while unauthenticated / offline. */
const isExpected = (e: unknown) => isNetworkError(e) || statusOf(e) === 401;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (!isExpected(error)) console.warn('[query]', (error as Error)?.message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (!isExpected(error)) console.warn('[mutation]', (error as Error)?.message);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (count, error) => !isExpected(error) && count < 1,
      retryDelay: 1500,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { queryClient };
