import { FlatList, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, PriceTag, Text } from '@/components/ui';
import { radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { useCartContext } from '@/context/cart-provider';
import { useShopOpen } from '@/hooks/use-shop-open';

export default function CartScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { cart, updateQty, remove } = useCartContext();
  const shopId = cart.items[0]?.business || null;
  const mixedShops = new Set(cart.items.map((i) => i.business).filter(Boolean)).size > 1;
  const shop = useShopOpen(shopId);

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={32} color={colors.primary} />}
        title="Your cart is empty"
        message="Browse the marketplace and add products you love."
        actionLabel="Start shopping"
        onAction={() => router.replace('/(tabs)/home')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
            <View style={styles.info}>
              <Text variant="bodyMedium" numberOfLines={1}>{item.name}</Text>
              {item.stock < item.quantity ? (
                <Text variant="small" color={colors.danger}>Only {item.stock} left</Text>
              ) : null}
              <PriceTag amount={item.price} size="sm" color={colors.primary} />
            </View>
            <View style={styles.controls}>
              <Pressable onPress={() => remove(item.productId)} hitSlop={6}>
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => (item.quantity <= 1 ? remove(item.productId) : updateQty(item.productId, item.quantity - 1))}
                  style={styles.stepBtn}
                  hitSlop={6}
                >
                  <Minus size={14} color={colors.text} />
                </Pressable>
                <Text variant="bodyMedium">{item.quantity}</Text>
                <Pressable
                  onPress={() => item.quantity < item.stock && updateQty(item.productId, item.quantity + 1)}
                  style={[styles.stepBtn, item.quantity >= item.stock && { opacity: 0.4 }]}
                  hitSlop={6}
                >
                  <Plus size={14} color={colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <SafeAreaView style={styles.bottom} edges={['bottom']}>
        <View style={styles.summaryRow}>
          <Text muted>Subtotal ({cart.totalItems} items)</Text>
          <Text variant="subheading">{formatNaira(cart.subtotal)}</Text>
        </View>
        <Text variant="small" muted style={{ marginBottom: spacing.sm }}>
          Delivery (optional): you&apos;ll choose at checkout.
        </Text>
        {mixedShops ? (
          <Text variant="small" color={colors.danger} style={{ marginBottom: spacing.sm }}>
            Your cart has items from more than one shop. Please check out one shop at a time (remove the other items for now).
          </Text>
        ) : null}
        {shop.open ? (
          <Button
            title="Proceed to checkout"
            disabled={mixedShops}
            onPress={() => router.push('/checkout')}
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Button title="Shop is closed now" disabled onPress={() => {}} />
            <Text variant="small" muted center>
              {shop.businessName ?? 'This shop'} is closed now.
              {shop.opensLabel ? ` ${shop.opensLabel}.` : ''} You can check out then.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md },
  image: { width: 76, height: 76, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  info: { flex: 1, gap: 2, justifyContent: 'center' },
  controls: { alignItems: 'flex-end', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  stepBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.floating },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
