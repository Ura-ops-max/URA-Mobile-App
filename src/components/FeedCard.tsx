import { useState } from 'react';
import { Pressable, Share, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, Bookmark, Flag, Heart, MessageCircle, Pencil, Share2, ShoppingCart, Star, Trash2 } from 'lucide-react-native';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { Avatar, Badge, CategoryChip, PriceTag, Text, useToast } from '@/components/ui';
import { ActionMenu, type MenuAction } from '@/components/ActionMenu';
import { MediaCarousel } from '@/components/MediaCarousel';
import { CommentSheet } from '@/components/CommentSheet';
import { timeAgo, formatCount } from '@/lib/format';
import { toggleBookmarkApi, toggleLikeApi } from '@/api/social';
import { deleteProduct } from '@/api/products';
import { deletePost } from '@/api/feed';
import { useCartContext } from '@/context/cart-provider';
import { useAuthContext } from '@/context/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiErrorMessage } from '@/api/orders';
import { blockAuthor, reportContent, useBlockedAuthors } from '@/lib/moderation';
import { SITE_URL } from '@/constants/config';
import type { UnifiedPost } from '@/types';

interface FeedCardProps {
  post: UnifiedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { add } = useCartContext();
  const { user } = useAuthContext();
  const { guard } = useRequireAuth();
  const blockedAuthors = useBlockedAuthors();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isProduct = post.type === 'PRODUCT';
  const productId = post.product?._id;
  const mediaWidth = width - spacing.lg * 2 - spacing.md * 2;

  // Feed posts (also product posts) are Post documents → like 'post'. Catalogue
  // items (GET /products) are Product documents, whose id is the product's → 'product'.
  const isCatalogItem = isProduct && post._id === productId;
  const likeMut = useMutation({
    mutationFn: () => toggleLikeApi(post._id, isCatalogItem ? 'product' : 'post'),
  });
  const bookmarkMut = useMutation({
    mutationFn: () => toggleBookmarkApi(post._id, isProduct ? 'Post' : 'Post'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const onLike = guard(() => {
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    likeMut.mutate();
  });
  const onBookmark = guard(() => {
    setBookmarked((v) => !v);
    bookmarkMut.mutate();
    toast.show(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  });
  const onAddToCart = guard(async () => {
    if (!productId) return;
    try {
      await add(productId, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add to cart.'));
    }
  });
  const onComments = guard(() => setCommentsOpen(true));

  const onShare = async () => {
    // Product pages are open to guests on the website; other posts link to the feed.
    const url = isProduct && productId ? `${SITE_URL}/dashboard/product/${productId}` : `${SITE_URL}/dashboard`;
    const title = isProduct ? (post.name ?? post.productName ?? post.product?.name ?? 'Check this out') : post.displayName;
    try {
      await Share.share({
        title,
        message: `${title} on URA${isProduct && post.price ? ` — ₦${post.price.toLocaleString()}` : ''}\n${url}`,
        url,
      });
    } catch {
      /* user dismissed */
    }
  };

  const openDetail = () => {
    if (isProduct && productId) router.push(`/product/${productId}`);
    else router.push(`/post/${post._id}`);
  };

  // Profiles need an account on the backend (GET /users/:id is sign-in only).
  const openAuthor = guard(() => {
    if (post.authorType === 'Business') router.push(`/business/${post.authorId}`);
    else router.push(`/user/${post.authorId}`);
  });

  const isOwner = !!user && (post.authorId === user._id || post.authorId === user.business?._id);
  const deleteMut = useMutation({
    mutationFn: () => (isProduct && productId ? deleteProduct(productId) : deletePost(post._id)),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const menuActions: MenuAction[] = isOwner
    ? [
        { label: 'Edit', icon: Pencil, show: isProduct, onPress: () => productId && router.push(`/edit-product/${productId}`) },
        { label: 'Delete', icon: Trash2, danger: true, onPress: () => deleteMut.mutate() },
      ]
    : [
        {
          label: 'Report',
          icon: Flag,
          danger: true,
          onPress: async () => {
            const ok = await reportContent({
              kind: isProduct ? 'product' : 'post',
              id: isProduct && productId ? productId : post._id,
              authorName: post.displayName,
              authorId: post.authorId,
              reporterId: user?._id,
            });
            if (!ok) toast.error('Could not open your email app.');
          },
        },
        {
          label: `Block ${post.displayName}`,
          icon: Ban,
          danger: true,
          onPress: () => {
            blockAuthor(post.authorId);
            toast.show(`You won't see posts from ${post.displayName}.`);
          },
        },
      ];

  if (blockedAuthors.has(post.authorId)) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable style={styles.authorRow} onPress={openAuthor}>
          <Avatar uri={post.displayAvatar} name={post.displayName} size={40} verified={post.isVerified} />
          <View>
            <Text variant="bodyMedium" numberOfLines={1}>
              {post.displayName}
            </Text>
            <Text variant="small" muted>
              {post.username ? `@${post.username} · ` : ''}
              {timeAgo(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        <View style={styles.headerRight}>
          {isProduct && post.category ? <CategoryChip label={post.category} size="sm" /> : null}
          <ActionMenu actions={menuActions} />
        </View>
      </View>

      {post.caption ? (
        <Text variant="body" style={styles.caption} numberOfLines={isProduct ? 2 : 4}>
          {post.caption}
        </Text>
      ) : null}

      {post.media.length > 0 ? (
        <View>
          <MediaCarousel
            media={post.media}
            mediaTypes={post.mediaTypes}
            width={mediaWidth}
            height={mediaWidth * 0.82}
            onPress={openDetail}
          />
          {post.isFeatured ? (
            <View style={styles.featured}>
              <Badge label="🔥 Deal" tone="primary" />
            </View>
          ) : null}
        </View>
      ) : null}

      {isProduct ? (
        <Pressable style={styles.productRow} onPress={openDetail}>
          <View style={{ flex: 1 }}>
            <Text variant="subheading" numberOfLines={1}>
              {post.name ?? post.productName ?? post.product?.name}
            </Text>
            <View style={styles.metaRow}>
              <PriceTag amount={post.price ?? post.product?.price ?? 0} size="md" color={colors.primary} />
              {post.rating > 0 ? (
                <View style={styles.rating}>
                  <Star size={13} color={colors.star} fill={colors.star} />
                  <Text variant="small" muted>
                    {post.rating.toFixed(1)} ({post.reviewCount})
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable style={styles.cartBtn} onPress={onAddToCart} hitSlop={6}>
            <ShoppingCart size={20} color={colors.white} />
          </Pressable>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onLike} hitSlop={8}>
          <Heart
            size={20}
            color={liked ? colors.danger : colors.muted}
            fill={liked ? colors.danger : 'transparent'}
          />
          <Text variant="small" muted>
            {formatCount(likeCount)}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onComments} hitSlop={8}>
          <MessageCircle size={20} color={colors.muted} />
          <Text variant="small" muted>
            {formatCount(post.commentsCount)}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onShare} hitSlop={8}>
          <Share2 size={20} color={colors.muted} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.action} onPress={onBookmark} hitSlop={8}>
          <Bookmark
            size={20}
            color={bookmarked ? colors.primary : colors.muted}
            fill={bookmarked ? colors.primary : 'transparent'}
          />
        </Pressable>
      </View>

      <CommentSheet postId={post._id} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  caption: { color: colors.text },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  featured: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
}));
