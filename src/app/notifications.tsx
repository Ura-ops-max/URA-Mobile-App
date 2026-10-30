import { useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Briefcase, Heart, MessageCircle, Package, Shield, Users, X } from 'lucide-react-native';
import { Avatar, EmptyState, Screen, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { timeAgo } from '@/lib/format';
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllRead,
  markNotificationRead,
  notificationRoute,
} from '@/api/notifications';
import { useRealtime } from '@/hooks/use-realtime';
import { useAuthContext } from '@/context/auth-provider';
import { setActiveProfile } from '@/lib/active-profile';
import type { Notification } from '@/types';

function iconFor(n: Notification) {
  if (n.modelType === 'Order') return Package;
  switch (n.type) {
    case 'LIKE':
      return Heart;
    case 'COMMENT':
      return MessageCircle;
    case 'SOCIAL':
      return Users;
    case 'BUSINESS':
      return Briefcase;
    case 'SECURITY':
      return Shield;
    default:
      return Bell;
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: getNotifications,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
  }, [queryClient]);

  // Live updates: new notifications appear instantly, no refresh needed.
  useRealtime('notifications', invalidate);

  const onPress = (n: Notification) => {
    if (!n.read) markNotificationRead(n._id).then(invalidate).catch(() => {});
    // A message to the shop opens the shop's inbox; anything else, the personal one.
    if (n.title === 'New Message' && user) {
      const toShop = !!user.business?._id && n.recipientId === user.business._id;
      setActiveProfile(toShop ? user.business!._id : user._id, toShop ? 'Business' : 'User');
    }
    const to = notificationRoute(n);
    if (to) router.push(to as never);
  };

  const onClearAll = () =>
    Alert.alert('Clear all notifications?', 'This removes every notification.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: () => clearAllNotifications().then(invalidate).catch(() => {}) },
    ]);

  const list = data ?? [];
  const unread = list.filter((n) => !n.read).length;

  return (
    <Screen padded>
      <View style={styles.head}>
        <Text variant="small" muted>
          {unread} unread
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          {unread > 0 ? (
            <Pressable onPress={() => markAllRead().then(invalidate).catch(() => {})} hitSlop={8}>
              <Text variant="label" color={colors.primary}>
                Mark all read
              </Text>
            </Pressable>
          ) : null}
          {list.length > 0 ? (
            <Pressable onPress={onClearAll} hitSlop={8}>
              <Text variant="label" color={colors.danger}>
                Clear all
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(n) => n._id}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const Icon = iconFor(item);
          return (
            <Pressable style={[styles.row, !item.read && styles.unread]} onPress={() => onPress(item)}>
              <View style={styles.avatarWrap}>
                {item.actor ? (
                  <Avatar uri={item.actor.avatar} name={item.actor.name} size={44} />
                ) : (
                  <View style={styles.systemIcon}>
                    <Bell size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.iconBadge}>
                  <Icon size={11} color={colors.white} />
                </View>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                {item.title && item.title !== item.text ? (
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {item.title}
                  </Text>
                ) : null}
                <Text variant="body" numberOfLines={3}>
                  {item.actor && !item.text.startsWith(item.actor.name) && item.type !== 'SYSTEM' && item.modelType !== 'Order'
                    ? `${item.actor.name} ${item.text}`
                    : item.text}
                </Text>
                <Text variant="small" muted>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                accessibilityLabel="Delete notification"
                onPress={() => deleteNotification(item._id).then(invalidate).catch(() => {})}
              >
                <X size={16} color={colors.mutedLight} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon={<Bell size={30} color={colors.primary} />} title="No notifications" message="You're all caught up!" />
          ) : undefined
        }
      />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  unread: { backgroundColor: colors.primarySoft },
  avatarWrap: { position: 'relative' },
  systemIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
}));
