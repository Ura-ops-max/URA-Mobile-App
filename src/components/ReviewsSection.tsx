import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { Avatar, Button, Rating, Sheet, Text, useToast } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { timeAgo } from '@/lib/format';
import { createReview, dislikeReview, getItemReviews, likeReview } from '@/api/reviews';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { reportContent } from '@/lib/moderation';

interface ReviewsSectionProps {
  itemId: string;
  itemModel: 'Product' | 'Business';
}

export function ReviewsSection({ itemId, itemModel }: ReviewsSectionProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { user } = useAuthContext();
  const { guard } = useRequireAuth();
  const { data } = useQuery({
    queryKey: ['reviews', itemId, user?._id ?? null],
    queryFn: () => getItemReviews(itemId, user?._id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reviews', itemId] });
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, 'Something went wrong. Please try again.'));

  const createMut = useMutation({
    mutationFn: () =>
      createReview({ reviewedItem: itemId, reviewedItemModel: itemModel, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Review posted');
      setSheetOpen(false);
      setComment('');
      setRating(5);
      invalidate();
    },
    onError,
  });
  const likeMut = useMutation({ mutationFn: (id: string) => likeReview(id), onSuccess: invalidate, onError });
  const dislikeMut = useMutation({ mutationFn: (id: string) => dislikeReview(id), onSuccess: invalidate, onError });

  const summary = data?.summary;
  const reviews = data?.reviews ?? [];
  const max = summary ? Math.max(...Object.values(summary.distribution), 1) : 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="subheading">Reviews</Text>
        <Button title="Write a review" variant="ghost" size="sm" fullWidth={false} onPress={guard(() => setSheetOpen(true))} />
      </View>

      {summary && summary.totalReviews > 0 ? (
        <View style={styles.summary}>
          <View style={styles.avgBox}>
            <Text variant="display" color={colors.primary}>{summary.averageRating.toFixed(1)}</Text>
            <Rating value={summary.averageRating} size={14} />
            <Text variant="small" muted>{summary.totalReviews} reviews</Text>
          </View>
          <View style={styles.bars}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5];
              return (
                <View key={star} style={styles.barRow}>
                  <Text variant="small" muted style={{ width: 12 }}>{star}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(count / max) * 100}%` }]} />
                  </View>
                  <Text variant="small" muted style={{ width: 22, textAlign: 'right' }}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <Text muted style={{ marginVertical: spacing.md }}>No reviews yet. Be the first to review!</Text>
      )}

      {reviews.map((r) => (
        <View key={r._id} style={styles.review}>
          <Avatar uri={r.author.avatar} name={r.author.name} size={40} />
          <View style={{ flex: 1 }}>
            <View style={styles.reviewTop}>
              <Text variant="bodyMedium">{r.author.name}</Text>
              <Text variant="small" muted>{timeAgo(r.createdAt)}</Text>
            </View>
            <Rating value={r.rating} size={12} />
            {r.comment ? <Text variant="body" style={styles.comment}>{r.comment}</Text> : null}
            {user && r.author._id !== user._id ? (
              <Text variant="small" muted onPress={() => void reportContent({ kind: 'review', id: r._id, authorName: r.author.name, authorId: r.author._id, reporterId: user._id })}>
                Report
              </Text>
            ) : null}
            <View style={styles.reactions}>
              <Pressable style={styles.reaction} onPress={guard(() => likeMut.mutate(r._id))} hitSlop={6}>
                <ThumbsUp size={15} color={r.isLiked ? colors.primary : colors.muted} fill={r.isLiked ? colors.primary : 'transparent'} />
                <Text variant="small" muted>{r.likes.length}</Text>
              </Pressable>
              <Pressable style={styles.reaction} onPress={guard(() => dislikeMut.mutate(r._id))} hitSlop={6}>
                <ThumbsDown size={15} color={r.isDisliked ? colors.danger : colors.muted} fill={r.isDisliked ? colors.danger : 'transparent'} />
                <Text variant="small" muted>{r.dislikes.length}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Write a review">
        <View style={styles.sheetBody}>
          <Text variant="label" muted>Your rating</Text>
          <Rating value={rating} editable onChange={setRating} size={32} />
          <TextInput
            placeholder="Share your experience…"
            placeholderTextColor={colors.mutedLight}
            value={comment}
            onChangeText={setComment}
            multiline
            style={styles.textarea}
          />
          <Button title="Post review" onPress={() => createMut.mutate()} loading={createMut.isPending} />
        </View>
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginTop: spacing.xl, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { flexDirection: 'row', gap: spacing.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center' },
  avgBox: { alignItems: 'center', gap: 2 },
  bars: { flex: 1, gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4, backgroundColor: colors.star },
  review: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comment: { marginTop: 4, lineHeight: 21 },
  reactions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sheetBody: { gap: spacing.md, paddingBottom: spacing.md },
  textarea: { minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, textAlignVertical: 'top', backgroundColor: colors.surface },
}));
