import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/auth-provider';
import { useToast } from '@/components/ui';
import { socketService } from '@/lib/socket';
import { mapNotification } from '@/api/notifications';

/**
 * Connects the Socket.IO client on login, emits `setup` with the active
 * profileId, and refreshes chat/notification/order queries on incoming events
 * (mirrors the web socket service). A new notification also shows a short
 * in-app pop-up, like the web's notification pop-ups.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthContext();
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    socketService.setup([user._id, user.business?._id ?? '']);

    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    };
    const onNotification = (payload: unknown) => {
      refreshNotifications();
      if (!payload || typeof payload !== 'object') return;
      const n = mapNotification(payload as Record<string, unknown>);
      if (n.modelType === 'Order') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
      // Chat messages already show in the chat list; don't pop those up.
      if (n.title !== 'New Message') toast.show(n.text);
    };
    const onMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    };
    socketService.on('notification_received', onNotification);
    // Sent to the receiver's own room for each new chat message ({ type: 'MESSAGE', conversationId }).
    const onNewNotification = () => {
      refreshNotifications();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socketService.on('new_notification', onNewNotification);
    socketService.on('message:received', onMessage);
    socketService.on('messages_seen', onMessage);

    return () => {
      socketService.off('notification_received', onNotification);
      socketService.off('new_notification', onNewNotification);
      socketService.off('message:received', onMessage);
      socketService.off('messages_seen', onMessage);
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, user?.business?._id, queryClient]);

  return <>{children}</>;
}
