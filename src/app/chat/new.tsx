import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { Avatar, Input, Tabs, Text, useToast } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';
import { accessConversation, getChatContacts, type ChatContact } from '@/api/chat';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';
import { useActiveProfile } from '@/lib/active-profile';

export default function NewChatScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [query, setQuery] = useState('');
  const toast = useToast();
  const { user } = useAuthContext();
  const active = useActiveProfile();
  const profileId = active.profileId ?? user?._id ?? '';
  // A shop doesn't follow anyone (GET /users/:shopId/social?type=following is empty),
  // so as a shop the "Following" list is the owner's.
  const listOwner = tab === 'following' && active.model === 'Business' ? (user?._id ?? '') : profileId;
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['chat-contacts', listOwner, tab],
    queryFn: () => getChatContacts(listOwner, tab),
    enabled: !!listOwner,
  });

  const filtered = (contacts ?? []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const startChat = async (contact: ChatContact) => {
    try {
      const conv = await accessConversation(contact._id, contact.name, contact.avatar, contact.model);
      router.replace(`/chat/${conv._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not start the chat.'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Input
          placeholder="Search people…"
          value={query}
          onChangeText={setQuery}
          leftIcon={<Search size={18} color={colors.muted} />}
        />
        <View style={styles.tabs}>
          <Tabs
            variant="pill"
            value={tab}
            onChange={(k) => setTab(k as typeof tab)}
            items={[
              { key: 'following', label: 'Following' },
              { key: 'followers', label: 'Followers' },
            ]}
          />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <Text muted center style={{ marginTop: spacing.xl }}>
              {tab === 'following' ? 'Follow people and shops to message them here.' : 'No followers yet.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => startChat(item)}>
            <Avatar uri={item.avatar} name={item.name} size={48} verified={item.model === 'Business'} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" numberOfLines={1}>{item.name}</Text>
              <Text variant="small" muted>{item.username}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, gap: spacing.md },
  tabs: { alignItems: 'flex-start' },
  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
}));
