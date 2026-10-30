/**
 * Kept for API compatibility with screens that subscribe to a realtime "topic".
 * Live updates are driven centrally by RealtimeProvider (Socket.IO) which
 * invalidates the relevant React Query caches, so per-screen subscriptions are
 * no-ops now. Screens still re-render from the refreshed queries.
 */
export function useRealtime(_topic: string, _onEvent: () => void): void {
  // no-op — see RealtimeProvider for the socket wiring.
}
