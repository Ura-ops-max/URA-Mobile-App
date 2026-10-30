// One order in My Orders or Shop Orders: who, what, how much, where it is,
// what happens to the money, and the buttons that apply right now.
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, Package, ShieldCheck } from 'lucide-react-native';
import { Badge, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { formatDateTime } from '@/lib/money';
import { getStatusConfig, itemsSummary, NORMAL_PAYMENT_NOTE } from '@/lib/order-status';
import { buyerPaidMessage } from '@/lib/whatsapp';
import type { ListOrder } from '@/types';
import { OrderActionButtons } from './OrderActionButtons';
import { WhatsAppButton } from './WhatsAppButton';

const STEPS = ['Paid', 'Ready', 'Delivered'];

function progressStep(o: ListOrder): number {
  if (o.paymentStatus !== 'paid') return 0;
  if (o.status === 'delivered') return 3;
  if (o.status === 'shipped') return 2;
  return 1;
}

export function OrderCard({ order, onChanged }: { order: ListOrder; onChanged: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const status = getStatusConfig(order.status, order.deliveryMethod, order.fulfilment);
  const isSeller = order.role === 'seller';
  const step = progressStep(order);
  const shopName = order.shop?.businessName ?? 'the shop';
  const showProgress = order.paymentStatus === 'paid' && !['refunded', 'cancelled'].includes(order.status);
  const canMessageShop =
    !isSeller && order.paymentStatus === 'paid' && ['processing', 'shipped'].includes(order.status);
  const open = () => router.push(`/order/${order._id}`);

  return (
    <View style={styles.card}>
      <Pressable onPress={open} style={{ gap: spacing.md }}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" weight="bold" numberOfLines={2}>
              {isSeller ? (order.buyerName ?? 'A customer') : shopName}
            </Text>
            <Text variant="small" muted>
              #{order.orderNumber} · {order.paidAt ? 'Paid' : 'Placed'} {formatDateTime(order.paidAt ?? order.createdAt)}
            </Text>
          </View>
          <Badge label={status.label} tone={status.tone} />
        </View>

        <View style={styles.body}>
          <View style={styles.thumbs}>
            {order.items.slice(0, 3).map((item, idx) => (
              <View key={idx} style={[styles.thumbWrap, idx > 0 && { marginLeft: -12 }]}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Package size={18} color={colors.mutedLight} />
                  </View>
                )}
              </View>
            ))}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="body" numberOfLines={2}>
              {itemsSummary(order.items)}
            </Text>
            <Text variant="small" muted>
              <Text variant="small" weight="bold">
                {formatNaira(isSeller ? order.itemsTotal : order.totalAmount)}
              </Text>{' '}
              · {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}
            </Text>
            <Text variant="small" muted>
              {order.paymentType === 'normal' ? 'Normal Payment' : 'Buyer-Protected Payment'}
            </Text>
          </View>
        </View>

        {showProgress ? (
          <View style={styles.steps} accessibilityLabel={`Step ${step} of 3`}>
            {STEPS.map((label, i) => (
              <View key={label} style={{ flex: 1 }}>
                <View style={[styles.bar, { backgroundColor: i < step ? colors.success : colors.border }]} />
                <Text variant="small" color={i < step ? colors.text : colors.mutedLight} style={{ marginTop: 4 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {order.moneyNote ? (
          <View style={styles.note}>
            <ShieldCheck size={14} color={colors.success} />
            <Text variant="small" muted style={{ flex: 1 }}>
              {order.moneyNote}
            </Text>
          </View>
        ) : null}
        {!isSeller && order.paymentType === 'normal' && order.paymentStatus === 'paid' ? (
          <Text variant="small" muted>
            {NORMAL_PAYMENT_NOTE}
          </Text>
        ) : null}
      </Pressable>

      {canMessageShop ? (
        <WhatsAppButton
          phone={order.shop?.phone}
          text={buyerPaidMessage(order.orderNumber, itemsSummary(order.items))}
          label={`Message ${shopName} about order ${order.orderNumber}`}
        />
      ) : null}
      <OrderActionButtons
        order={{
          _id: order._id,
          orderNumber: order.orderNumber,
          deliveryMethod: order.deliveryMethod,
          itemsTotal: order.itemsTotal,
          shopName,
          role: order.role,
          actions: order.actions,
        }}
        onChanged={onChanged}
      />
      <Pressable onPress={open} style={styles.view} hitSlop={6}>
        <Text variant="label" muted>
          View order
        </Text>
        <ChevronRight size={14} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbs: { flexDirection: 'row' },
  thumbWrap: { borderWidth: 2, borderColor: colors.surface, borderRadius: radii.md + 2 },
  thumb: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  steps: { flexDirection: 'row', gap: 6 },
  bar: { height: 5, borderRadius: 3 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  view: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-end', paddingVertical: 4 },
}));
