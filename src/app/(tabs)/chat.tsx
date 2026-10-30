import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, PenSquare, Store, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, EmptyState, IconButton, Text } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { getConversations } from '@/api/chat';
import { timeAgo } from '@/lib/format';
import { setActiveProfile, useActiveProfile } from '@/lib/active-profile';
import { useAuthContext } from '@/context/auth-provider';

export default function ChatListScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuthContext();
  const shop = user?.business ?? null;
  const active = useActiveProfile();
  const profileId = active.profileId ?? user?._id ?? null;
  const asShop = !!shop && active.model === 'Business';

  // Live updates come from RealtimeProvider, which refreshes ['conversations'].
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['conversations', profileId],
    queryFn: () => getConversations(profileId),
    enabled: !!profileId,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Messages</Text>
        <IconButton variant="soft" icon={<PenSquare size={20} color={colors.primary} />} onPress={() => router.push('/chat/new')} />
      </View>

      {/* Shop owners: chats sent to the shop arrive in its own inbox (web Personal / Business tabs). */}
      {shop?._id && user ? (
        <View style={styles.switcher}>
          {[
            { key: 'User' as const, id: user._id, label: 'Personal', Icon: User },
            { key: 'Business' as const, id: shop._id!, label: shop.businessName || 'My shop', Icon: Store },
          ].map(({ key, id, label, Icon }) => {
            const on = (key === 'Business') === asShop;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setActiveProfile(id, key)}
                style={[styles.seg, on && styles.segOn]}
              >
                <Icon size={15} color={on ? colors.white : colors.muted} />
                <Text numberOfLines={1} style={[styles.segText, { color: on ? colors.white : colors.muted }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/chat/${item._id}`)}>
            <Avatar uri={item.participant.avatar} name={item.participant.name} size={52} verified={item.participant.model === 'Business'} />
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                  {item.participant.name}
                </Text>
                <Text variant="small" muted>
                  {timeAgo(item.lastMessageAt)}
                </Text>
              </View>
              <View style={styles.rowTop}>
                <Text
                  variant="caption"
                  muted={item.unreadCount === 0}
                  numberOfLines={1}
                  style={{ flex: 1 }}
                  color={item.unreadCount ? colors.text : undefined}
                >
                  {item.lastMessage || 'Start a conversation'}
                </Text>
                {item.unreadCount > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<MessageCircle size={30} color={colors.primary} />}
              title={asShop ? 'No shop messages yet' : 'No messages yet'}
              message={asShop ? 'When customers message your shop, the chats show up here.' : 'Start chatting with sellers and buyers.'}
              actionLabel="New message"
              onAction={() => router.push('/chat/new')}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
  },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: radii.pill },
  segOn: { backgroundColor: colors.primary },
  segText: { fontFamily: fontFamily.semibold, fontSize: 13, flexShrink: 1 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unread: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: colors.white, fontSize: 11, fontFamily: fontFamily.bold },
}));
