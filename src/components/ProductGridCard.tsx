import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Package, Star } from 'lucide-react-native';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { PriceTag, Text, Badge } from '@/components/ui';
import type { UnifiedPost } from '@/types';

export function ProductGridCard({ post }: { post: UnifiedPost }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const productId = post.product?._id;
  return (
    <Pressable
      style={styles.card}
      onPress={() => productId && router.push(`/product/${productId}`)}
    >
      <View>
        {post.media[0] ? (
          <Image source={{ uri: post.media[0] }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Package size={28} color={colors.mutedLight} />
          </View>
        )}
        {post.isFeatured ? (
          <View style={styles.badge}>
            <Badge label="Deal" tone="primary" />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text variant="label" numberOfLines={1}>
          {post.name ?? post.productName ?? post.product?.name}
        </Text>
        <Text variant="small" muted numberOfLines={1}>
          {post.displayName}
        </Text>
        <View style={styles.metaRow}>
          <PriceTag amount={post.price ?? post.product?.price ?? 0} size="sm" color={colors.primary} />
          {post.rating > 0 ? (
            <View style={styles.rating}>
              <Star size={11} color={colors.star} fill={colors.star} />
              <Text variant="small" muted>
                {post.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  badge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  body: { padding: spacing.sm, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
}));
