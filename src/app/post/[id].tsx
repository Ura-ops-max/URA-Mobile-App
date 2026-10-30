import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Send } from 'lucide-react-native';
import { Avatar, Text } from '@/components/ui';
import { FeedCard } from '@/components/FeedCard';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { getSinglePost } from '@/api/feed';
import { addComment, getComments, toggleCommentLike } from '@/api/posts';
import { timeAgo } from '@/lib/format';
import { useRealtime } from '@/hooks/use-realtime';

export default function PostDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: post, isLoading } = useQuery({ queryKey: ['post', id], queryFn: () => getSinglePost(id) });
  const { data: comments } = useQuery({ queryKey: ['comments', id], queryFn: () => getComments(id) });
  const [draft, setDraft] = useState('');

  useRealtime(
    `comments:${id}`,
    useCallback(() => queryClient.invalidateQueries({ queryKey: ['comments', id] }), [queryClient, id]),
  );

  const addMut = useMutation({
    mutationFn: (content: string) => addComment(id, content),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });
  const likeMut = useMutation({ mutationFn: (cid: string) => toggleCommentLike(id, cid) });

  if (isLoading || !post) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FeedCard post={post} />
        <Text variant="subheading" style={styles.commentsTitle}>Comments ({comments?.length ?? 0})</Text>
        {(comments ?? []).map((c) => (
          <View key={c._id} style={styles.comment}>
            <Avatar uri={c.author.avatar} name={c.author.name} size={38} />
            <View style={styles.bubble}>
              <View style={styles.commentTop}>
                <Text variant="label">{c.author.name}</Text>
                <Text variant="small" muted>{timeAgo(c.createdAt)}</Text>
              </View>
              <Text variant="body">{c.content}</Text>
            </View>
            <Pressable style={styles.like} hitSlop={6} onPress={() => likeMut.mutate(c._id)}>
              <Heart size={15} color={c.isLiked ? colors.danger : colors.mutedLight} fill={c.isLiked ? colors.danger : 'transparent'} />
              {c.likes.length > 0 ? <Text variant="small" muted>{c.likes.length}</Text> : null}
            </Pressable>
          </View>
        ))}
        {comments && comments.length === 0 ? (
          <Text muted center style={{ paddingVertical: spacing.lg }}>No comments yet. Be the first!</Text>
        ) : null}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          placeholder="Add a comment…"
          placeholderTextColor={colors.mutedLight}
          value={draft}
          onChangeText={setDraft}
          style={styles.input}
        />
        <Pressable style={[styles.send, !draft.trim() && { opacity: 0.5 }]} onPress={() => draft.trim() && addMut.mutate(draft.trim())} hitSlop={6}>
          <Send size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  commentsTitle: { marginTop: spacing.sm },
  comment: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, gap: 2 },
  commentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  like: { alignItems: 'center', gap: 2, paddingTop: 6 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}));
