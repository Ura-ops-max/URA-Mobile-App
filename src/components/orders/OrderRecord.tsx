// The order's record, for both sides: who bought, from which shop, exactly
// what, and when each step happened (only times the server recorded). Either
// side can share it as a receipt, so there is a clear record if anything goes wrong.
import { Pressable, Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Receipt, Share2, ShieldCheck, Store, User } from 'lucide-react-native';
import { Button, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { formatDateTime } from '@/lib/money';
import { formatAddress, getStatusConfig } from '@/lib/order-status';
import type { OrderDetail } from '@/types';

interface Step {
  label: string;
  at: string;
  note?: string;
  tone?: 'success' | 'danger' | 'info' | 'neutral';
  upcoming?: boolean;
}

/** Each recorded step, oldest first. */
function stepsOf(o: OrderDetail, role: 'buyer' | 'seller'): Step[] {
  const shop = typeof o.business === 'object' ? o.business?.businessName : undefined;
  const steps: Step[] = [{ label: 'Order placed', at: o.createdAt, tone: 'neutral' }];
  if (o.paidAt) steps.push({ label: 'Paid', at: o.paidAt, tone: 'success' });
  if (o.riderBookedAt) steps.push({ label: 'Rider booked for delivery', at: o.riderBookedAt, tone: 'info' });
  if (o.rejectedAt)
    steps.push({ label: `Rejected by ${shop ?? 'the shop'}`, at: o.rejectedAt, tone: 'danger', note: o.rejectReason || undefined });
  if (o.cancelledAt) steps.push({ label: role === 'buyer' ? 'You cancelled the order' : 'Buyer cancelled the order', at: o.cancelledAt, tone: 'danger' });
  const reported = o.disputedAt ?? o.buyerReportedAt;
  if (reported) steps.push({ label: 'Problem reported', at: reported, tone: 'danger' });
  if (o.sellerRespondedAt) steps.push({ label: 'Shop responded to the problem', at: o.sellerRespondedAt, tone: 'info' });
  if (o.payoutReleasedAt) steps.push({ label: `Money paid to ${shop ?? 'the shop'}`, at: o.payoutReleasedAt, tone: 'success' });
  else if (o.autoReleaseAt && o.paymentStatus === 'paid' && !['refunded', 'cancelled'].includes(o.status))
    steps.push({ label: 'Money goes to the shop unless a problem is reported', at: o.autoReleaseAt, tone: 'info', upcoming: true });
  return steps.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function OrderRecord({ order, role }: { order: OrderDetail; role: 'buyer' | 'seller' }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const shop = typeof order.business === 'object' ? order.business : null;
  const buyer = typeof order.user === 'object' ? order.user : null;
  const buyerName = `${buyer?.firstName ?? ''} ${buyer?.lastName ?? ''}`.trim() || 'Customer';
  const subtotal = order.itemsTotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const status = getStatusConfig(order.status, order.deliveryMethod, order.fulfilment);
  const steps = stepsOf(order, role);
  const payment = order.paymentType === 'normal' ? 'Normal Payment' : 'Buyer-Protected Payment';
  const where =
    order.deliveryMethod === 'delivery' || order.fulfilment === 'seller_delivery'
      ? formatAddress(order.shippingAddress) || 'Address not provided'
      : `Pickup at ${shop?.businessName ?? 'the shop'}${shop?.address?.fullAddress ? `, ${shop.address.fullAddress}` : ''}`;

  const receipt = [
    `URA order receipt — #${order.orderNumber}`,
    `Status: ${status.label}`,
    '',
    `Shop: ${shop?.businessName ?? '—'}${shop?.contact?.phone && role === 'buyer' ? ` (${shop.contact.phone})` : ''}`,
    `Buyer: ${role === 'seller' ? buyerName : 'Me'}${role === 'seller' && order.shippingAddress?.phone ? ` (${order.shippingAddress.phone})` : ''}`,
    '',
    'Items:',
    ...order.items.map((i) => `  ${i.quantity} × ${i.name} @ ${formatNaira(i.price)} = ${formatNaira(i.price * i.quantity)}`),
    `Items total: ${formatNaira(subtotal)}`,
    ...(order.deliveryFee > 0 ? [`Delivery: ${formatNaira(order.deliveryFee)}`] : []),
    `Total: ${formatNaira(order.totalAmount)}`,
    `Payment: ${payment}${order.paymentStatus === 'paid' ? ' (paid)' : ' (not paid)'}`,
    `${order.deliveryMethod === 'delivery' ? 'Delivery to' : 'Fulfilment'}: ${where}`,
    ...(order.trackingNumber ? [`Tracking number: ${order.trackingNumber}`] : []),
    '',
    'Timeline:',
    ...steps.map((s) => `  ${formatDateTime(s.at)} — ${s.label}${s.upcoming ? ' (scheduled)' : ''}${s.note ? ` (“${s.note}”)` : ''}`),
  ].join('\n');

  const copyNumber = async () => {
    await Clipboard.setStringAsync(order.orderNumber);
    toast.success('Order number copied');
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <Receipt size={18} color={colors.primary} />
        </View>
        <Text variant="subheading" style={{ flex: 1 }}>
          Order record
        </Text>
        <Pressable onPress={() => void copyNumber()} hitSlop={8} style={styles.copy} accessibilityLabel="Copy order number">
          <Text variant="small" weight="semibold">#{order.orderNumber}</Text>
          <Copy size={14} color={colors.muted} />
        </Pressable>
      </View>

      {/* Who */}
      <View style={styles.parties}>
        <Party
          icon={<User size={16} color={colors.info} />}
          title="Ordered by"
          name={role === 'seller' ? buyerName : 'You'}
          detail={role === 'seller' ? order.shippingAddress?.phone : undefined}
        />
        <Party
          icon={<Store size={16} color={colors.primary} />}
          title="Sold by"
          name={role === 'seller' ? 'Your shop' : (shop?.businessName ?? 'The shop')}
          detail={role === 'buyer' ? shop?.contact?.phone : shop?.businessName}
        />
      </View>

      {/* What */}
      <View style={styles.block}>
        <Text variant="label" muted>
          WHAT WAS ORDERED
        </Text>
        {order.items.map((i, idx) => (
          <View key={idx} style={styles.line}>
            <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>
              {i.quantity} × {i.name}
            </Text>
            <Text variant="body" muted>
              {formatNaira(i.price * i.quantity)}
            </Text>
          </View>
        ))}
        <View style={[styles.line, styles.total]}>
          <Text variant="bodyMedium">Total paid</Text>
          <Text variant="bodyMedium">{formatNaira(order.totalAmount)}</Text>
        </View>
        <View style={styles.inline}>
          <ShieldCheck size={13} color={colors.success} />
          <Text variant="small" muted>
            {payment} · {order.paymentStatus === 'paid' ? 'Paid' : 'Not paid yet'}
          </Text>
        </View>
      </View>

      {/* When */}
      <View style={styles.block}>
        <Text variant="label" muted>
          TIMELINE
        </Text>
        {steps.map((s, i) => {
          const dot =
            s.tone === 'success' ? colors.success : s.tone === 'danger' ? colors.danger : s.tone === 'info' ? colors.info : colors.mutedLight;
          return (
            <View key={`${s.label}-${i}`} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: s.upcoming ? 'transparent' : dot, borderColor: dot }]} />
                {i < steps.length - 1 ? <View style={styles.railLine} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: spacing.md }}>
                <Text variant="bodyMedium">{s.label}</Text>
                <Text variant="small" muted>
                  {s.upcoming ? 'Scheduled for ' : ''}
                  {formatDateTime(s.at)}
                </Text>
                {s.note ? (
                  <Text variant="small" muted>
                    Reason: “{s.note}”
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <Button
        title="Share receipt"
        variant="outline"
        leftIcon={<Share2 size={16} color={colors.text} />}
        onPress={() => Share.share({ title: `Order #${order.orderNumber}`, message: receipt }).catch(() => {})}
      />
      <Text variant="small" muted center>
        Keep a copy for your records. URA support can use it if there&apos;s ever an issue.
      </Text>
    </View>
  );
}

function Party({ icon, title, name, detail }: { icon: React.ReactNode; title: string; name: string; detail?: string | null }) {
  const styles = useStyles();
  return (
    <View style={styles.party}>
      <View style={styles.inline}>
        {icon}
        <Text variant="small" muted>
          {title}
        </Text>
      </View>
      <Text variant="bodyMedium" numberOfLines={1}>
        {name}
      </Text>
      {detail ? (
        <Text variant="small" muted numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
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
    gap: spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headIcon: { width: 34, height: 34, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceAlt, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  parties: { flexDirection: 'row', gap: spacing.md },
  party: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, padding: spacing.md, gap: 2 },
  block: { gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  total: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 4 },
  railLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
}));
