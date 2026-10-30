import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Flag, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Text, useToast } from '@/components/ui';
import { useActiveProfile } from '@/lib/active-profile';
import { ActionMenu } from '@/components/ActionMenu';
import { blockAuthor, reportContent } from '@/lib/moderation';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { timeAgo } from '@/lib/format';
import { getConversations, getMessages, markConversationRead, sendMessage } from '@/api/chat';
import { useRealtime } from '@/hooks/use-realtime';
import { useAuthContext } from '@/context/auth-provider';
import { socketService } from '@/lib/socket';

export default function ChatWindowScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const toast = useToast();
  // The identity this chat is viewed as (Personal or the shop), chosen in Messages.
  const active = useActiveProfile();
  const myProfileId = active.profileId ?? user?._id ?? null;
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations', myProfileId],
    queryFn: () => getConversations(myProfileId),
    enabled: !!myProfileId,
  });
  const conversation = conversations?.find((c) => c._id === id);

  const { data: messages } = useQuery({ queryKey: ['messages', id], queryFn: () => getMessages(id) });

  useEffect(() => {
    markConversationRead(id);
    socketService.joinChat(id);
  }, [id]);

  useRealtime(
    `chat:${id}`,
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    }, [queryClient, id]),
  );

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await sendMessage(id, text);
    } catch {
      setDraft(text);
      toast.error('Message not sent. Please try again.');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['messages', id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Avatar uri={conversation?.participant.avatar} name={conversation?.participant.name} size={34} verified={conversation?.participant.model === 'Business'} />
              <Text variant="subheading" numberOfLines={1}>{conversation?.participant.name ?? 'Chat'}</Text>
            </View>
          ),
          headerRight: () =>
            conversation ? (
              <ActionMenu
                actions={[
                  {
                    label: 'Report',
                    icon: Flag,
                    danger: true,
                    onPress: () =>
                      void reportContent({
                        kind: 'message',
                        id: conversation._id,
                        authorName: conversation.participant.name,
                        authorId: conversation.participant._id,
                        reporterId: user?._id,
                      }),
                  },
                  {
                    label: `Block ${conversation.participant.name}`,
                    icon: Ban,
                    danger: true,
                    onPress: () => {
                      blockAuthor(conversation.participant._id);
                      toast.show(`You won't see posts from ${conversation.participant.name}.`);
                    },
                  },
                ]}
              />
            ) : null,
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages ?? []}
          keyExtractor={(m) => m._id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.senderId === myProfileId;
            return (
              <View style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirRow]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.their]}>
                  <Text color={mine ? colors.white : colors.text}>{item.content}</Text>
                  <Text variant="small" color={mine ? 'rgba(255,255,255,0.7)' : colors.mutedLight} style={styles.time}>
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            placeholder="Type a message…"
            placeholderTextColor={colors.mutedLight}
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            multiline
          />
          <Pressable style={styles.send} onPress={onSend} hitSlop={6}>
            <Send size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  their: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  time: { alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, maxHeight: 120, backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}));
