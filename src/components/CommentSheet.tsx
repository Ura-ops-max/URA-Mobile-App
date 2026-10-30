import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Send } from 'lucide-react-native';
import { Avatar, Sheet, Text } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { timeAgo } from '@/lib/format';
import { addComment, getComments, toggleCommentLike } from '@/api/posts';
import { useRealtime } from '@/hooks/use-realtime';

interface CommentSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function CommentSheet({ postId, visible, onClose }: CommentSheetProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId),
    enabled: visible,
  });

  useRealtime(
    `comments:${postId}`,
    useCallback(() => queryClient.invalidateQueries({ queryKey: ['comments', postId] }), [queryClient, postId]),
  );

  const addMut = useMutation({
    mutationFn: (content: string) => addComment(postId, content),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
  const likeMut = useMutation({ mutationFn: (id: string) => toggleCommentLike(postId, id) });

  return (
    <Sheet visible={visible} onClose={onClose} title={`Comments${comments ? ` (${comments.length})` : ''}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={40}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.xl }} />
        ) : (
          <FlatList
            data={comments ?? []}
            keyExtractor={(c) => c._id}
            style={{ maxHeight: 380 }}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <Avatar uri={item.author.avatar} name={item.author.name} size={38} />
                <View style={styles.bubble}>
                  <View style={styles.head}>
                    <Text variant="label">{item.author.name}</Text>
                    <Text variant="small" muted>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text variant="body">{item.content}</Text>
                </View>
                <Pressable style={styles.likeBtn} hitSlop={6} onPress={() => { likeMut.mutate(item._id); }}>
                  <Heart size={15} color={item.isLiked ? colors.danger : colors.mutedLight} fill={item.isLiked ? colors.danger : 'transparent'} />
                  {item.likes.length > 0 ? <Text variant="small" muted>{item.likes.length}</Text> : null}
                </Pressable>
              </View>
            )}
            ListEmptyComponent={<Text muted center style={{ paddingVertical: spacing.xl }}>No comments yet. Be the first!</Text>}
          />
        )}
        <View style={styles.composer}>
          <TextInput
            placeholder="Add a comment…"
            placeholderTextColor={colors.mutedLight}
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            multiline
          />
          <Pressable
            style={[styles.send, !draft.trim() && { opacity: 0.5 }]}
            disabled={!draft.trim() || addMut.isPending}
            onPress={() => addMut.mutate(draft.trim())}
          >
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { gap: spacing.md, paddingBottom: spacing.sm },
  comment: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bubble: { flex: 1, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likeBtn: { alignItems: 'center', gap: 2, paddingTop: 2 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
  input: { flex: 1, maxHeight: 100, backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}));
