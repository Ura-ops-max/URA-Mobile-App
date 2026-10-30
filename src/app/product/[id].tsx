import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Minus, Pencil, Plus, ShoppingCart, Store, Trash2, Truck } from 'lucide-react-native';
import { Badge, Button, IconButton, PriceTag, Rating, Text, useToast } from '@/components/ui';
import { ReviewsSection } from '@/components/ReviewsSection';
import { ActionMenu, type MenuAction } from '@/components/ActionMenu';
import { radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { getSingleProduct, deletePost } from '@/api/feed';
import { deleteProduct } from '@/api/products';
import { toggleWishlist } from '@/api/social';
import { useCartContext } from '@/context/cart-provider';
import { useAuthContext } from '@/context/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiErrorMessage } from '@/api/orders';

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { add } = useCartContext();
  const { user } = useAuthContext();
  const { guard } = useRequireAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getSingleProduct(id),
  });

  const wishMut = useMutation({
    mutationFn: () => toggleWishlist(post?.product?._id ?? id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  if (isLoading || !post) {
    return (
      <SafeAreaView style={styles.safe}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} style={{ margin: spacing.lg }} />
      </SafeAreaView>
    );
  }

  const product = post.product;
  const stock = post.stock ?? product?.stock ?? 0;
  const isOwner = !!user && (post.authorId === user._id || post.authorId === user.business?._id);
  const ownerActions: MenuAction[] = [
    { label: 'Edit product', icon: Pencil, onPress: () => product && router.push(`/edit-product/${product._id}`) },
    {
      label: 'Delete product',
      icon: Trash2,
      danger: true,
      onPress: async () => {
        if (product) await deleteProduct(product._id);
        else await deletePost(post._id);
        toast.success('Product deleted');
        router.back();
      },
    },
  ];

  const onAddToCart = guard(async () => {
    if (!product) return;
    try {
      await add(product._id, qty);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add to cart.'));
    }
  });
  const onBuyNow = guard(async () => {
    if (!product) return;
    try {
      await add(product._id, qty);
      router.push('/cart');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not add to cart.'));
    }
  });
  const onWishlist = guard(() => {
    setWishlisted((v) => !v);
    wishMut.mutate();
    toast.show(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {post.media.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width, height: width }} contentFit="cover" />
            ))}
          </ScrollView>
          <SafeAreaView style={styles.topBar} edges={['top']}>
            <IconButton variant="surface" icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} />
            <View style={styles.topRight}>
              <IconButton
                variant="surface"
                icon={<Heart size={22} color={wishlisted ? colors.danger : colors.text} fill={wishlisted ? colors.danger : 'transparent'} />}
                onPress={onWishlist}
              />
              {isOwner ? (
                <View style={styles.ownerMenu}>
                  <ActionMenu actions={ownerActions} size={22} color={colors.text} />
                </View>
              ) : null}
            </View>
          </SafeAreaView>
          {post.media.length > 1 ? (
            <View style={styles.dots}>
              {post.media.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === activeImg ? colors.primary : 'rgba(255,255,255,0.6)' }]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="title" style={{ flex: 1 }}>{post.name ?? post.productName}</Text>
            {post.category ? <Badge label={post.category} tone="primary" /> : null}
          </View>
          <PriceTag amount={post.price ?? 0} size="lg" color={colors.primary} />
          <View style={styles.metaRow}>
            <Rating value={post.rating} count={post.reviewCount} size={15} showValue />
            <Text variant="small" muted>·</Text>
            <Text variant="small" muted>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</Text>
            {product?.size ? <Badge label={`Size ${product.size}`} /> : null}
          </View>

          <Pressable style={styles.seller} onPress={guard(() => router.push(`/business/${post.authorId}`))}>
            <Store size={18} color={colors.primary} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>{post.displayName}</Text>
            <Text variant="label" color={colors.primary}>View store</Text>
          </Pressable>

          <View style={styles.deliveryNote}>
            <Truck size={16} color={colors.success} />
            <Text variant="small" muted>Delivery or pickup · Buyer-Protected Payment available</Text>
          </View>

          <Text variant="subheading" style={styles.sectionTitle}>Description</Text>
          <Text variant="body" style={styles.desc}>{product?.description ?? post.caption}</Text>

          <View style={styles.qtyRow}>
            <Text variant="subheading">Quantity</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.stepBtn} hitSlop={6}>
                <Minus size={16} color={colors.text} />
              </Pressable>
              <Text variant="subheading">{qty}</Text>
              <Pressable onPress={() => setQty((q) => Math.min(stock, q + 1))} style={styles.stepBtn} hitSlop={6}>
                <Plus size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <ReviewsSection itemId={product?._id ?? id} itemModel="Product" />
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <Button
          title="Add to cart"
          variant="secondary"
          style={{ flex: 1 }}
          leftIcon={<ShoppingCart size={18} color={colors.primary} />}
          onPress={onAddToCart}
          disabled={stock <= 0}
        />
        <Button title="Buy now" style={{ flex: 1 }} onPress={onBuyNow} disabled={stock <= 0} />
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerMenu: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  seller: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm },
  deliveryNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing.md },
  desc: { color: colors.text, lineHeight: 23 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.floating },
}));
