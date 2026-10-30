// One payment screen for both payment types (web CheckoutPaymentModal).
// URA's backend creates the escrow and returns the payment token; Payluk's
// widget collects the money. Only the backend decides an order is paid (from
// Payluk's webhook, or by checking with Payluk): after the widget reports
// back, this sheet asks the backend and waits.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Check, CreditCard, Info, ShieldCheck, Wallet, X } from 'lucide-react-native';
import { Button, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { formatAddress } from '@/lib/order-status';
import {
  apiErrorCode,
  apiErrorMessage,
  getOrderById,
  getPaymentStatus,
  payFromWallet,
  startPayment,
} from '@/api/orders';
import { getWallet } from '@/api/wallet';
import type { StartPaymentResponse } from '@/types';
import { CheckoutAd } from './CheckoutAd';
import { PaylukCheckout, type PaylukResult } from './PaylukCheckout';
import { SendOrderToShop } from '@/components/orders/WhatsAppButton';
import { useSubmitLock } from '@/hooks/use-submit-lock';

type Phase = 'ready' | 'starting' | 'confirming' | 'paid' | 'slow';

const POLL_MS = 4_000;
const POLL_FOR_MS = 3 * 60_000;

const naira2 = (n: number) =>
  `₦${(Number(n) || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function PaymentSheet({
  orderId,
  orderNumber,
  payment,
  businessId,
  onClose,
  onPaid,
}: {
  orderId: string;
  orderNumber?: string;
  /** From POST /orders/:id/pay. Mount the sheet only while a payment is open, so each opening starts fresh. */
  payment: StartPaymentResponse | null;
  businessId?: string | null;
  onClose: () => void;
  /** Called once the backend reports the order paid (or the buyer leaves to the order). */
  onPaid: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('ready');
  const [widget, setWidget] = useState<StartPaymentResponse | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [attemptFailed, setAttemptFailed] = useState(false);
  const mounted = useRef(true);
  // The first attempt uses the reference we were given; later ones get a new
  // one from the backend (Payluk wants a unique reference per checkout).
  const usedFirstRef = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = !!payment;

  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: getWallet, enabled: visible });
  const { data: orderData } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: visible && attemptFailed,
    staleTime: 60_000,
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const finishPaid = useCallback(() => {
    setPhase('paid');
    toast.success('Payment confirmed. Your order is being processed.');
    setTimeout(() => mounted.current && onPaid(), 1200);
  }, [onPaid, toast]);

  // Ask URA's backend (which checks with Payluk) until the order is paid.
  const waitForConfirmation = useCallback(() => {
    setPhase('confirming');
    const until = Date.now() + POLL_FOR_MS;
    const check = async () => {
      if (!mounted.current) return;
      try {
        const s = await getPaymentStatus(orderId);
        if (s.paymentStatus === 'paid') return finishPaid();
      } catch {
        /* network blip: keep waiting */
      }
      if (Date.now() >= until) {
        if (mounted.current) setPhase('slow');
        return;
      }
      pollTimer.current = setTimeout(() => void check(), POLL_MS);
    };
    void check();
  }, [orderId, finishPaid]);

  const lock = useSubmitLock();
  const payWithWidget = () =>
    lock(async () => {
      if (!payment) return;
      setPhase('starting');
      let attempt = payment;
      try {
        if (usedFirstRef.current) attempt = await startPayment(orderId);
        usedFirstRef.current = true;
      } catch (err) {
        setPhase('ready');
        if (apiErrorCode(err) === 'ALREADY_PAID') return finishPaid();
        toast.error(apiErrorMessage(err, 'Could not start the payment. Please try again.'));
        return;
      }
      setWidget(attempt);
    });

  const onWidgetResult = (r: PaylukResult) => {
    setWidget(null);
    if (r.type === 'done') return waitForConfirmation();
    setPhase('ready');
    if (r.type === 'closed') {
      setAttemptFailed(true);
      toast.show('Payment window closed. Your order is saved; you can pay again.');
    } else {
      toast.error(r.message);
    }
  };

  const amountToPay = payment?.amountToPay ?? 0;
  const canPayFromWallet = !!wallet?.hasProfile && wallet.mainBalance >= amountToPay && amountToPay > 0;
  const payWithWallet = () =>
    lock(async () => {
      if (walletBusy) return;
      setWalletBusy(true);
      try {
        const s = await payFromWallet(orderId);
        if (s.paymentStatus === 'paid') finishPaid();
        else waitForConfirmation();
      } catch (err) {
        if (apiErrorCode(err) === 'ALREADY_PAID') return finishPaid();
        toast.error(apiErrorMessage(err, 'Could not pay from your wallet. Please try again.'));
      } finally {
        if (mounted.current) setWalletBusy(false);
      }
    });

  const busy = phase === 'starting' || phase === 'confirming' || walletBusy;
  const showChoices = phase === 'ready' || phase === 'starting';
  const breakdown = payment?.breakdown;
  const shop = orderData?.order.business && typeof orderData.order.business === 'object' ? orderData.order.business : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? () => {} : onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ScrollView contentContainerStyle={{ gap: spacing.lg }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headIcon}>
              <ShieldCheck size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subheading">Complete Payment</Text>
              <Text variant="small" muted>
                {payment?.paymentType === 'normal' ? 'Normal Payment' : 'Buyer-Protected Payment'}
                {orderNumber ? ` · ${orderNumber}` : ''}
              </Text>
            </View>
            {!busy ? (
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
                <X size={22} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          {breakdown ? (
            <View style={styles.breakdown}>
              <Row label="Items" value={naira2(breakdown.items)} />
              {breakdown.delivery > 0 ? <Row label="Delivery" value={naira2(breakdown.delivery)} /> : null}
              {breakdown.serviceFee > 0 ? <Row label="Service fee" value={naira2(breakdown.serviceFee)} /> : null}
              <View style={[styles.row, styles.totalRow]}>
                <Text variant="label" color={colors.primary}>
                  TOTAL
                </Text>
                <Text variant="heading" color={colors.primary}>
                  {naira2(breakdown.total)}
                </Text>
              </View>
            </View>
          ) : null}

          {phase === 'confirming' ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text variant="bodyMedium">Confirming your payment...</Text>
              <Text variant="small" muted center>
                This usually takes a few seconds.
              </Text>
            </View>
          ) : null}

          {phase === 'slow' ? (
            <View style={styles.center}>
              <Text variant="bodyMedium" center>
                We&apos;re still confirming your payment
              </Text>
              <Text variant="small" muted center>
                You&apos;ll get a notice as soon as it&apos;s confirmed. You don&apos;t need to pay again.
              </Text>
              <Button title="Go to my order" onPress={onPaid} />
            </View>
          ) : null}

          {phase === 'paid' ? (
            <View style={styles.center}>
              <View style={styles.paidIcon}>
                <Check size={28} color={colors.success} />
              </View>
              <Text variant="bodyMedium">Payment confirmed!</Text>
              <Text variant="small" muted>
                Your order is being processed.
              </Text>
            </View>
          ) : null}

          {showChoices ? (
            <View style={{ gap: spacing.sm }}>
              <Button
                title={`Pay ${naira2(amountToPay)}`}
                size="lg"
                loading={phase === 'starting'}
                disabled={busy}
                leftIcon={<CreditCard size={18} color={colors.white} />}
                onPress={() => void payWithWidget()}
              />
              <Text variant="small" muted center>
                Pay securely with Payluk without leaving URA.
              </Text>

              {canPayFromWallet ? (
                <View style={styles.walletBox}>
                  <View style={styles.row}>
                    <View style={styles.inline}>
                      <Wallet size={16} color={colors.primary} />
                      <Text variant="label" muted>
                        Wallet balance
                      </Text>
                    </View>
                    <Text variant="bodyMedium">{formatNaira(wallet?.mainBalance ?? 0)}</Text>
                  </View>
                  <Button
                    title="Pay from wallet"
                    variant="outline"
                    loading={walletBusy}
                    disabled={busy}
                    leftIcon={<Wallet size={16} color={colors.text} />}
                    onPress={() => void payWithWallet()}
                  />
                </View>
              ) : null}

              {payment?.paymentType === 'normal' ? (
                <View style={styles.warn}>
                  <Info size={14} color={colors.warning} />
                  <Text variant="small" style={{ flex: 1 }} color={colors.warningText}>
                    Normal Payment goes straight to the seller. For protection, choose Buyer-Protected Payment.
                  </Text>
                </View>
              ) : (
                <View style={[styles.inline, { justifyContent: 'center', marginTop: spacing.sm }]}>
                  <ShieldCheck size={14} color={colors.info} />
                  <Text variant="small" muted>
                    Held safely until you confirm delivery
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {showChoices && attemptFailed && shop?.businessName && orderData ? (
            <View style={styles.divider}>
              <SendOrderToShop
                shopName={shop.businessName}
                shopPhone={shop.contact?.phone}
                orderNumber={orderData.order.orderNumber}
                items={orderData.order.items}
                total={orderData.order.totalAmount}
                paid={false}
                deliveryMethod={orderData.order.deliveryMethod}
                address={formatAddress(orderData.order.shippingAddress)}
              />
            </View>
          ) : null}

          {showChoices || phase === 'confirming' ? <CheckoutAd businessId={businessId} /> : null}
        </ScrollView>
      </View>

      <PaylukCheckout orderId={orderId} payment={widget} onResult={onWidgetResult} />
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text variant="body" muted>
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '92%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdown: { backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  paidIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBox: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
}));
