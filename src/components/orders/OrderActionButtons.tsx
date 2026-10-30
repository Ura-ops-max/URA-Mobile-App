// The buttons for one order, for whoever is looking. Which buttons show is
// decided by the server (`actions`), so the lists and the order page agree.
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CreditCard,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react-native';
import { Button, useToast } from '@/components/ui';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import {
  apiErrorMessage,
  cancelOrder,
  claimPayment,
  confirmReceived,
  markOrderReady,
  rejectOrder,
  requestRefund,
} from '@/api/orders';
import type { OrderActions } from '@/types';
import { ConfirmSheet } from './ConfirmSheet';
import { ProblemSheet } from './ProblemSheet';
import { useSubmitLock } from '@/hooks/use-submit-lock';

export interface ActionOrder {
  _id: string;
  orderNumber: string;
  deliveryMethod?: string;
  /** What the shop is paid for the items (no delivery or fees). */
  itemsTotal: number;
  shopName: string;
  role: 'buyer' | 'seller';
  actions: OrderActions;
}

type SheetKind = 'confirm' | 'cancel' | 'reject' | 'refund' | 'problem' | null;

export function OrderActionButtons({
  order,
  onChanged,
  onPay,
}: {
  order: ActionOrder;
  onChanged: () => void;
  /** The order page opens the payment sheet; lists go to the order page. */
  onPay?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [reason, setReason] = useState('');
  const a = order.actions;
  const isDelivery = order.deliveryMethod === 'delivery';

  const lock = useSubmitLock();
  const run = (work: () => Promise<string>, fallback: string) =>
    lock(async () => {
      setBusy(true);
      try {
        toast.success(await work());
        setSheet(null);
        onChanged();
      } catch (err) {
        toast.error(apiErrorMessage(err, fallback));
      } finally {
        setBusy(false);
      }
    });

  const markReady = (mode?: 'pickup' | 'self_delivery') =>
    run(async () => {
      await markOrderReady(order._id, isDelivery ? undefined : mode);
      if (isDelivery) return 'Rider booked. The buyer has been told.';
      return mode === 'self_delivery'
        ? "The buyer has been told you're bringing it."
        : 'The buyer has been told it is ready for pickup.';
    }, 'Could not update the order. Please try again.');

  if (!Object.values(a).some(Boolean)) return null;

  const icon = (C: typeof Truck, color: string = colors.white) => <C size={16} color={color} />;

  return (
    <View style={styles.wrap}>
      {a.pay ? (
        <Button
          title="Pay now"
          leftIcon={icon(CreditCard)}
          disabled={busy}
          onPress={onPay ?? (() => router.push(`/order/${order._id}`))}
        />
      ) : null}
      {a.confirmDelivery ? (
        <Button
          title="Confirm delivery"
          leftIcon={icon(PackageCheck)}
          disabled={busy}
          onPress={() => setSheet('confirm')}
          style={{ backgroundColor: colors.success }}
        />
      ) : null}
      {a.getRefund ? (
        <Button title="Get my money back" leftIcon={icon(RotateCcw)} disabled={busy} onPress={() => setSheet('refund')} />
      ) : null}
      {a.reportProblem ? (
        <Button
          title="Report a problem"
          variant="outline"
          leftIcon={icon(AlertTriangle, colors.danger)}
          disabled={busy}
          onPress={() => setSheet('problem')}
        />
      ) : null}
      {a.cancel ? (
        <Button title="Cancel" variant="outline" leftIcon={icon(XCircle, colors.text)} disabled={busy} onPress={() => setSheet('cancel')} />
      ) : null}

      {a.markReady ? (
        <Button
          title={isDelivery ? 'Book a rider' : 'Ready for pickup'}
          leftIcon={icon(isDelivery ? Truck : PackageOpen)}
          loading={busy}
          onPress={() => markReady('pickup')}
        />
      ) : null}
      {a.markReady && !isDelivery ? (
        <Button
          title="I'll deliver it myself"
          variant="secondary"
          leftIcon={icon(Truck, colors.primary)}
          disabled={busy}
          onPress={() => markReady('self_delivery')}
        />
      ) : null}
      {a.claimPayment ? (
        <Button
          title="Claim payment"
          variant="outline"
          leftIcon={icon(BadgeCheck, colors.text)}
          loading={busy}
          onPress={() =>
            run(async () => {
              await claimPayment(order._id);
              return 'Payment claimed. It has been paid to your wallet.';
            }, 'Could not claim right now. Please try again.')
          }
        />
      ) : null}
      {a.respondToProblem ? (
        <Button
          title="Respond to problem"
          variant="outline"
          leftIcon={icon(AlertTriangle, colors.danger)}
          disabled={busy}
          onPress={() => setSheet('problem')}
        />
      ) : null}
      {a.reject ? (
        <Button title="Reject order" variant="outline" leftIcon={icon(Ban, colors.danger)} disabled={busy} onPress={() => setSheet('reject')} />
      ) : null}

      <ConfirmSheet
        visible={sheet === 'confirm'}
        title="Confirm delivery"
        text={`Confirming releases ${formatNaira(order.itemsTotal)} to ${order.shopName}. This can't be undone.`}
        confirmLabel="Confirm delivery"
        cancelLabel="Not yet"
        busy={busy}
        onClose={() => setSheet(null)}
        onConfirm={() =>
          run(async () => {
            await confirmReceived(order._id);
            return `Thanks. ${order.shopName} has been paid.`;
          }, 'Could not confirm right now. Please try again.')
        }
      />
      <ConfirmSheet
        visible={sheet === 'cancel'}
        title="Cancel this order?"
        text="You have not paid for it yet. The shop will not get it."
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        tone="danger"
        busy={busy}
        onClose={() => setSheet(null)}
        onConfirm={() =>
          run(async () => {
            await cancelOrder(order._id);
            return 'Order cancelled.';
          }, 'Could not cancel the order. Please try again.')
        }
      />
      <ConfirmSheet
        visible={sheet === 'reject'}
        title="Reject this order?"
        text="Only do this if you can't fill it. The buyer gets their money back and the items go back on sale."
        confirmLabel="Reject order"
        cancelLabel="Keep it"
        tone="danger"
        busy={busy}
        onClose={() => setSheet(null)}
        onConfirm={() =>
          run(async () => {
            await rejectOrder(order._id, reason.trim() || undefined);
            return 'Order rejected. The buyer has been told, and the items are back on sale.';
          }, 'Could not reject the order. Please try again.')
        }
      >
        <TextInput
          value={reason}
          onChangeText={setReason}
          maxLength={300}
          multiline
          placeholder="Reason for the buyer (optional)"
          placeholderTextColor={colors.mutedLight}
          style={styles.textarea}
          textAlignVertical="top"
        />
      </ConfirmSheet>
      <ConfirmSheet
        visible={sheet === 'refund'}
        title="Get my money back"
        text={`${order.shopName} could not fill this order. Your money will go back to you.`}
        confirmLabel="Get my money back"
        busy={busy}
        onClose={() => setSheet(null)}
        onConfirm={() =>
          run(async () => {
            const r = await requestRefund(order._id);
            return r.refunded
              ? 'Your money is on its way back to you.'
              : 'We have asked for your refund. URA will finish it soon.';
          }, 'Could not get your money back right now. Please try again.')
        }
      />
      <ProblemSheet
        visible={sheet === 'problem'}
        orderId={order._id}
        asSeller={order.role === 'seller'}
        onClose={() => setSheet(null)}
        onDone={() => {
          setSheet(null);
          onChanged();
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.sm },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
}));
