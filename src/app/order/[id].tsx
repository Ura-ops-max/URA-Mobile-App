// One order, for the buyer or the seller: where it is, what was bought,
// delivery/pickup details, and the next action for whoever is looking.
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, Package, Phone, ShieldCheck, Store, Truck } from 'lucide-react-native';
import { Badge, Button, Divider, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { formatDateTime } from '@/lib/money';
import { formatAddress, getStatusConfig, NORMAL_PAYMENT_NOTE } from '@/lib/order-status';
import { sellerBringingMessage, sellerReadyMessage } from '@/lib/whatsapp';
import { apiErrorCode, apiErrorMessage, getDispute, getOrderById, startPayment } from '@/api/orders';
import { trackDelivery } from '@/api/delivery';
import { OrderActionButtons } from '@/components/orders/OrderActionButtons';
import { OrderRecord } from '@/components/orders/OrderRecord';
import { SendOrderToShop, WhatsAppButton } from '@/components/orders/WhatsAppButton';
import { PaymentSheet } from '@/components/checkout/PaymentSheet';
import { CheckoutAd } from '@/components/checkout/CheckoutAd';
import type { StartPaymentResponse } from '@/types';
import { useSubmitLock } from '@/hooks/use-submit-lock';

/** Best-effort one-line summary of a Fez tracking response (web summariseTracking). */
const summariseTracking = (data: unknown): string => {
  const raw = data as Record<string, any> | null;
  const d = raw?.data ?? raw;
  const candidates = [
    d?.order?.orderStatus,
    d?.orderStatus,
    d?.status,
    Array.isArray(d?.history) ? d.history[d.history.length - 1]?.status : undefined,
  ];
  const hit = candidates.find((c) => typeof c === 'string' && c.trim());
  return hit ?? 'No update from the courier yet.';
};

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);
  const [payment, setPayment] = useState<StartPaymentResponse | null>(null);
  const lock = useSubmitLock();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
  const order = data?.order;
  const disputeStatus = order?.disputeStatus;
  const { data: dispute } = useQuery({
    queryKey: ['order', id, 'dispute', disputeStatus],
    queryFn: () => getDispute(id),
    enabled: !!id && !!disputeStatus,
  });

  const reload = () => {
    void refetch();
    void qc.invalidateQueries({ queryKey: ['orders'] });
    void qc.invalidateQueries({ queryKey: ['wallet'] });
  };

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />;
  }
  if (isError || !order || !data) {
    return (
      <View style={styles.errorWrap}>
        <Text variant="bodyMedium" center>
          {apiErrorMessage(error, 'Could not load this order.')}
        </Text>
        <Button title="Back to My Orders" variant="outline" fullWidth={false} onPress={() => router.replace('/orders')} />
      </View>
    );
  }

  const { role, actions, moneyNote } = data;
  const isDelivery = order.deliveryMethod === 'delivery';
  const status = getStatusConfig(order.status, order.deliveryMethod, order.fulfilment);
  const shopDelivers = order.fulfilment === 'seller_delivery';
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shop = typeof order.business === 'object' ? order.business : null;
  const buyer = typeof order.user === 'object' ? order.user : null;
  const buyerName = `${buyer?.firstName ?? ''} ${buyer?.lastName ?? ''}`.trim();
  const isNormal = order.paymentType === 'normal';
  const isPaid = order.paymentStatus === 'paid';
  const disputed = ['open', 'investigating'].includes(order.disputeStatus ?? '');
  const ongoing = isPaid && ['processing', 'shipped'].includes(order.status);
  const shopName = shop?.businessName ?? 'the shop';
  const buyerFirstName = buyer?.firstName ?? '';

  const steps = [
    { key: 'paid', label: 'Paid', done: isPaid },
    {
      key: 'ready',
      label: isDelivery || shopDelivers ? 'On the way' : 'Ready for pickup',
      done: ['shipped', 'delivered'].includes(order.status),
    },
    { key: 'done', label: 'Completed', done: order.status === 'delivered' },
  ];

  const checkTracking = async () => {
    if (!order.trackingNumber) return;
    setBusy(true);
    try {
      setTracking(summariseTracking(await trackDelivery(order.trackingNumber)));
    } catch {
      setTracking('Could not reach the courier right now. Try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  const payNow = () =>
    lock(async () => {
      setBusy(true);
      try {
        setPayment(await startPayment(order._id));
      } catch (err) {
        if (apiErrorCode(err) === 'ALREADY_PAID') reload();
        else toast.error(apiErrorMessage(err, 'Could not start the payment. Please try again.'));
      } finally {
        setBusy(false);
      }
    });

  return (
    <>
      <Stack.Screen options={{ title: `Order #${order.orderNumber}` }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={reload} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.card}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text variant="small" muted>
                ORDER
              </Text>
              <Text variant="heading">#{order.orderNumber}</Text>
              <Text variant="small" muted>
                {role === 'seller' ? `Customer: ${buyerName || 'Customer'}` : `From ${shop?.businessName ?? 'seller'}`}
                {' · '}
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
            <Badge label={status.label} tone={status.tone} />
          </View>

          {isPaid && order.status !== 'refunded' ? (
            <View style={styles.steps}>
              {steps.map((s, i) => (
                <View key={s.key} style={[styles.stepWrap, i === steps.length - 1 && { flex: 0 }]}>
                  <View style={{ alignItems: 'center', width: 76 }}>
                    <View style={[styles.stepDot, { backgroundColor: s.done ? colors.success : colors.border }]}>
                      <Check size={14} color={colors.white} />
                    </View>
                    <Text variant="small" center color={s.done ? colors.text : colors.mutedLight} style={{ marginTop: 4 }}>
                      {s.label}
                    </Text>
                  </View>
                  {i < steps.length - 1 ? (
                    <View style={[styles.stepLine, { backgroundColor: steps[i + 1].done ? colors.success : colors.border }]} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Next action: which buttons show is decided by the server. */}
          <View style={{ gap: spacing.sm }}>
            {role === 'buyer' && (ongoing || (!isPaid && order.status === 'pending')) ? (
              <SendOrderToShop
                shopName={shopName}
                shopPhone={shop?.contact?.phone}
                orderNumber={order.orderNumber}
                items={order.items}
                total={order.totalAmount}
                paid={isPaid}
                deliveryMethod={order.deliveryMethod}
                address={[order.shippingAddress?.fullAddress, order.shippingAddress?.city].filter(Boolean).join(', ')}
              />
            ) : null}
            {ongoing && role === 'seller' && !isDelivery && !shopDelivers ? (
              <WhatsAppButton
                phone={order.shippingAddress?.phone}
                text={sellerReadyMessage(buyerFirstName, order.orderNumber, shopName)}
                label="Message buyer: your order is ready"
              />
            ) : null}
            {ongoing && role === 'seller' && shopDelivers ? (
              <WhatsAppButton
                phone={order.shippingAddress?.phone}
                text={sellerBringingMessage(buyerFirstName, order.orderNumber, shopName)}
                label="Message buyer: I'm bringing your order"
              />
            ) : null}
            <OrderActionButtons
              order={{
                _id: order._id,
                orderNumber: order.orderNumber,
                deliveryMethod: order.deliveryMethod,
                itemsTotal: order.itemsTotal ?? subtotal,
                shopName,
                role,
                actions,
              }}
              onChanged={reload}
              onPay={busy ? () => {} : () => void payNow()}
            />
            {order.trackingNumber ? (
              <Button
                title="Track delivery"
                variant="outline"
                loading={busy}
                leftIcon={<Truck size={16} color={colors.text} />}
                onPress={() => void checkTracking()}
              />
            ) : null}
          </View>

          {order.trackingNumber ? (
            <Text variant="body" muted>
              Tracking number: <Text weight="bold">{order.trackingNumber}</Text>
              {tracking ? `\nLatest update: ${tracking}` : ''}
            </Text>
          ) : null}
          {moneyNote ? (
            <View style={styles.inline}>
              <ShieldCheck size={14} color={colors.success} />
              <Text variant="small" muted style={{ flex: 1 }}>
                {moneyNote}
              </Text>
            </View>
          ) : null}
          {actions.confirmDelivery ? (
            <Text variant="small" muted>
              Only tap &quot;Confirm delivery&quot; once you have everything.
            </Text>
          ) : null}
          {actions.getRefund ? (
            <Text variant="small" muted>
              {shop?.businessName ?? 'The shop'} could not fill this order. Tap &quot;Get my money back&quot;.
            </Text>
          ) : null}
          {role === 'buyer' && isNormal && isPaid ? (
            <Text variant="small" muted>
              {NORMAL_PAYMENT_NOTE}
            </Text>
          ) : null}
          {role === 'seller' && isNormal && isPaid && order.status === 'processing' ? (
            <Text variant="small" muted>
              Can&apos;t fill this order?{' '}
              <Text variant="small" weight="bold" color={colors.primary} onPress={() => router.push('/contact')}>
                Contact URA
              </Text>
            </Text>
          ) : null}
          {actions.pay ? (
            <Text variant="small" muted>
              This order is not paid yet. Tap &quot;Pay now&quot; to finish.
            </Text>
          ) : null}
          {disputed ? (
            <View style={styles.danger}>
              <Text variant="small" color={colors.danger}>
                A problem was reported on this order. URA is looking into it, and the money stays on hold until it is
                sorted out.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text variant="subheading">Items</Text>
          {order.items.map((item, idx) => {
            const img = item.image ?? (typeof item.product === 'object' ? item.product?.media?.[0] : undefined);
            return (
              <View key={idx} style={styles.itemRow}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Package size={18} color={colors.mutedLight} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="small" muted>
                    {item.quantity} × {formatNaira(item.price)}
                  </Text>
                </View>
                <Text variant="bodyMedium">{formatNaira(item.price * item.quantity)}</Text>
              </View>
            );
          })}
          <Divider />
          <Row label="Items" value={formatNaira(subtotal)} />
          {order.deliveryFee > 0 ? <Row label="Delivery" value={formatNaira(order.deliveryFee)} /> : null}
          <Row label="Total" value={formatNaira(order.totalAmount)} bold />
        </View>

        {/* Delivery / pickup */}
        <View style={styles.card}>
          <Text variant="subheading">{isDelivery ? 'Delivery' : shopDelivers ? 'Delivered by the shop' : 'Pickup'}</Text>
          {isDelivery || shopDelivers ? (
            <View style={styles.inline}>
              <MapPin size={16} color={colors.muted} />
              <Text variant="body" style={{ flex: 1 }}>
                {formatAddress(order.shippingAddress) || 'Address not provided'}
              </Text>
            </View>
          ) : (
            <View style={styles.inline}>
              <Store size={16} color={colors.muted} />
              <Text variant="body" style={{ flex: 1 }}>
                {shop?.businessName}
                {shop?.address?.fullAddress ? `, ${shop.address.fullAddress}` : ''}
              </Text>
            </View>
          )}
          {order.shippingAddress?.phone && role === 'seller' ? (
            <Pressable style={styles.inline} onPress={() => Linking.openURL(`tel:${order.shippingAddress?.phone}`)}>
              <Phone size={16} color={colors.muted} />
              <Text variant="body" color={colors.primary}>
                {order.shippingAddress.phone}
              </Text>
            </Pressable>
          ) : null}
          {role === 'buyer' && shop?.contact?.phone ? (
            <Pressable style={styles.inline} onPress={() => Linking.openURL(`tel:${shop.contact?.phone}`)}>
              <Phone size={16} color={colors.muted} />
              <Text variant="body" color={colors.primary}>
                Shop: {shop.contact.phone}
              </Text>
            </Pressable>
          ) : null}
          {role === 'buyer' && shop?._id ? (
            <Text variant="bodyMedium" color={colors.primary} onPress={() => router.push(`/business/${shop._id}`)}>
              Visit {shop.businessName}
            </Text>
          ) : null}
        </View>

        {/* Who ordered what, and when — the same record for buyer and seller */}
        <OrderRecord order={order} role={role} />

        {/* Dispute conversation */}
        {order.disputeStatus && dispute?.dispute?.entries.length ? (
          <View style={styles.card}>
            <Text variant="subheading">Problem reported</Text>
            {dispute.dispute.entries.map((d, i) => (
              <View
                key={i}
                style={[styles.entry, { backgroundColor: d.from === 'seller' ? colors.surfaceAlt : colors.dangerSoft }]}
              >
                <Text variant="small" muted>
                  {d.from === 'seller' ? 'SELLER' : 'BUYER'}
                  {d.at ? ` · ${new Date(d.at).toLocaleString()}` : ''}
                </Text>
                <Text variant="body">{d.message}</Text>
                {d.proofUrl ? (
                  <Text variant="small" weight="bold" color={colors.primary} onPress={() => Linking.openURL(d.proofUrl!)}>
                    View attachment
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {role === 'buyer' ? <CheckoutAd businessId={shop?._id} /> : null}
      </ScrollView>

      {payment ? (
        <PaymentSheet
          orderId={order._id}
          orderNumber={order.orderNumber}
          payment={payment}
          businessId={shop?._id}
          onClose={() => setPayment(null)}
          onPaid={() => {
            setPayment(null);
            reload();
          }}
        />
      ) : null}
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text variant={bold ? 'subheading' : 'body'} muted={!bold}>
        {label}
      </Text>
      <Text variant={bold ? 'subheading' : 'body'}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  steps: { flexDirection: 'row', alignItems: 'flex-start' },
  stepWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 3, borderRadius: 2, marginTop: 13, marginHorizontal: -20 },
  inline: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  danger: { backgroundColor: colors.dangerSoft, borderRadius: radii.md, padding: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entry: { borderRadius: radii.md, padding: spacing.md, gap: 4 },
}));
