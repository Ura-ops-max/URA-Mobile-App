// Checkout (web pages/dashboard/CheckoutPage): shipping details → choose
// delivery and payment type → URA creates the order and the payment →
// the payment sheet opens. The page total is the item total; delivery is
// optional and chosen in the next step.
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  ShieldCheck,
  Store,
  Truck,
  Wallet,
} from 'lucide-react-native';
import { Button, Input, Sheet, Text, useToast } from '@/components/ui';
import { radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { NIGERIAN_STATES } from '@/lib/nigeria';
import { useCartContext } from '@/context/cart-provider';
import { useAuthContext } from '@/context/auth-provider';
import { usePaymentProfile } from '@/hooks/use-payment-profile';
import { useShopOpen } from '@/hooks/use-shop-open';
import { getDeliveryCost } from '@/api/delivery';
import { apiErrorCode, apiErrorMessage, checkout, saveShippingAddress, startPayment } from '@/api/orders';
import { getWallet } from '@/api/wallet';
import { CheckoutAd } from '@/components/checkout/CheckoutAd';
import { PaymentSheet } from '@/components/checkout/PaymentSheet';
import type { PaymentType, StartPaymentResponse } from '@/types';
import { useSubmitLock } from '@/hooks/use-submit-lock';

const MIN_ORDER_AMOUNT = 1000;
const PHONE_RE = /^\+?[0-9]{10,15}$/;

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const qc = useQueryClient();
  const { cart } = useCartContext();
  const { user, data: me } = useAuthContext();
  const { ensure, settingUp } = usePaymentProfile();

  const business = (me?.related?.businesses?.[0] ?? null) as
    | { address?: { state?: string; city?: string; street?: string; fullAddress?: string }; contact?: { phone?: string } }
    | null;
  const ship = user?.shippingAddress ?? {};
  // Prefilled from the saved shipping address (then the shop's), until the buyer edits.
  const [phoneEdit, setPhone] = useState<string | null>(null);
  const [stateEdit, setState] = useState<string | null>(null);
  const phone = phoneEdit ?? (ship.phone || user?.phone || business?.contact?.phone || '');
  const state = stateEdit ?? (ship.state || business?.address?.state || '');
  const city = ship.city || business?.address?.city || '';
  const fullAddress = ship.fullAddress || business?.address?.street || business?.address?.fullAddress || '';
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);
  const [statePicker, setStatePicker] = useState(false);

  const [chooser, setChooser] = useState<'delivery' | 'payment' | null>(null);
  const [withDelivery, setWithDelivery] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [transfer, setTransfer] = useState<{ orderId: string; orderNumber?: string; payment: StartPaymentResponse } | null>(null);

  const firstProductId = cart.items[0]?.productId;
  const sellerBusinessId = cart.items[0]?.business || null;
  const shop = useShopOpen(sellerBusinessId);
  const hasShippingAddress = !!(ship.fullAddress && ship.city && ship.phone);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    enabled: !!user,
  });

  // Live delivery quote for the chosen state.
  const quote = useQuery({
    queryKey: ['delivery-cost', state, firstProductId],
    queryFn: () => getDeliveryCost({ state, productId: firstProductId }),
    enabled: !!state && !!firstProductId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const quotedFee = quote.data ? (quote.data.totalCost ?? quote.data.cost) : null;
  const deliveryFee = quotedFee != null && quotedFee > 0 ? quotedFee : null;
  const deliveryLoading = quote.isFetching;
  const deliveryError = quote.isError
    ? apiErrorMessage(quote.error, 'Delivery fee unavailable right now.')
    : quote.data && deliveryFee == null
      ? `Delivery to ${state} isn't available right now.`
      : null;

  const total = cart.subtotal;
  const belowMinimum = total > 0 && total < MIN_ORDER_AMOUNT;
  const canDeliver = deliveryFee != null && deliveryFee > 0;
  const deliveryTotal = total + (deliveryFee ?? 0);

  const validate = () => {
    const p = phone.trim();
    const pe = !p ? 'Phone number is required' : !PHONE_RE.test(p) ? 'Enter a valid phone number (e.g. 08012345678)' : null;
    const se = state ? null : 'Please select your state';
    setPhoneError(pe);
    setStateError(se);
    return !pe && !se;
  };

  const onProceed = () => {
    if (!validate()) return;
    void ensure(() => setChooser('delivery'));
  };

  const lock = useSubmitLock();
  const createOrderAndPay = (mode: PaymentType) =>
    lock(async () => {
      setChooser(null);
      setPlacing(true);
      try {
        const shippingAddress = { phone: phone.trim(), state, city, fullAddress };
        const order = await checkout({
          shippingAddress,
          deliveryFee: withDelivery ? (deliveryFee ?? 0) : 0,
          deliveryMethod: withDelivery ? 'delivery' : 'pickup',
          paymentMethod: 'card',
          paymentType: mode,
        });
        if (!order?._id) {
          toast.error('Could not start payment. Please try again.');
          return;
        }
        void qc.invalidateQueries({ queryKey: ['cart'] });
        void qc.invalidateQueries({ queryKey: ['orders'] });
        const payment = await startPayment(order._id);
        saveShippingAddress(shippingAddress).catch(() => {});
        setTransfer({ orderId: order._id, orderNumber: order.orderNumber, payment });
      } catch (err) {
        const code = apiErrorCode(err);
        if (code === 'PAYLUK_PROFILE_REQUIRED') {
          toast.show('Set up your payment profile first.');
          router.push('/payluk-setup');
        } else if (code === 'PAYMENTS_BUSY') {
          toast.error('Payments are busy. Please try again in a moment.');
        } else if (code === 'PRODUCT_NOT_AVAILABLE' || code === 'PAYLUK_SETUP_REQUIRED') {
          toast.show('This product is not yet available for purchase.');
        } else {
          toast.error(apiErrorMessage(err, 'Checkout failed. Please try again.'));
        }
      } finally {
        setPlacing(false);
      }
    });

  if (cart.items.length === 0 && !transfer) {
    return (
      <View style={styles.empty}>
        <Text variant="subheading">Your cart is empty</Text>
        <Button title="Start shopping" fullWidth={false} onPress={() => router.replace('/(tabs)/home')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionTitle n={1} title="Shipping Details" />
        {!hasShippingAddress ? (
          <View style={styles.info}>
            <AlertCircle size={16} color={colors.primary} />
            <Text variant="small" style={{ flex: 1 }}>
              Add your delivery details below and we&apos;ll save them, so next time checkout is one tap.
            </Text>
          </View>
        ) : null}
        <Input label="Full name" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} editable={false} />
        <Input
          label="Phone number"
          placeholder="08012345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            if (phoneError) setPhoneError(null);
          }}
          error={phoneError ?? undefined}
        />
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">State</Text>
          <Pressable style={[styles.select, stateError ? { borderColor: colors.danger } : null]} onPress={() => setStatePicker(true)}>
            <Text color={state ? colors.text : colors.mutedLight}>{state || 'Select your state…'}</Text>
            <ChevronDown size={18} color={colors.muted} />
          </Pressable>
          {stateError ? (
            <Text variant="small" color={colors.danger}>
              {stateError}
            </Text>
          ) : null}
        </View>

        <SectionTitle n={2} title="Payment Method" />
        <View style={styles.payBox}>
          <CreditCard size={22} color={colors.mutedLight} />
          <Text variant="body" muted>
            Card, transfer or USSD
          </Text>
          <Text variant="small" muted>
            Secure payment by Payluk
          </Text>
        </View>

        <View style={styles.summary}>
          <Text variant="label" muted>
            IN YOUR BAG
          </Text>
          {cart.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Image source={item.image ? { uri: item.image } : undefined} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="small" muted>
                  Qty: {item.quantity}
                </Text>
              </View>
              <Text variant="bodyMedium">{formatNaira(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <SummaryRow label="Subtotal" value={formatNaira(total)} />
          <Text variant="small" muted>
            Delivery (optional): you&apos;ll choose on the next step.
          </Text>
          <SummaryRow label="Total" value={formatNaira(total)} bold />
          <View style={[styles.walletRow]}>
            <View style={styles.inline}>
              <Wallet size={16} color={colors.primary} />
              <Text variant="label" muted>
                Wallet balance
              </Text>
            </View>
            <Text variant="bodyMedium">{walletLoading ? 'Loading…' : formatNaira(wallet?.mainBalance ?? 0)}</Text>
          </View>
        </View>

        <CheckoutAd businessId={sellerBusinessId} />

        <View style={styles.trust}>
          <View style={styles.inline}>
            <ShieldCheck size={16} color={colors.success} />
            <Text variant="small" muted>
              Buyer Protection
            </Text>
          </View>
          <View style={styles.inline}>
            <Truck size={16} color={colors.info} />
            <Text variant="small" muted>
              Fast Delivery
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.bottom} edges={['bottom']}>
        {!shop.open ? (
          <Text variant="small" color={colors.danger} center style={{ marginBottom: spacing.sm }}>
            {shop.businessName ?? 'This shop'} is closed now.{shop.opensLabel ? ` ${shop.opensLabel}.` : ''} You can check out then.
          </Text>
        ) : belowMinimum ? (
          <Text variant="small" color={colors.danger} center style={{ marginBottom: spacing.sm }}>
            The minimum order is {formatNaira(MIN_ORDER_AMOUNT)}. Please add more items.
          </Text>
        ) : (
          <Text variant="small" muted center style={{ marginBottom: spacing.sm }}>
            Choose delivery next, then pay securely with Payluk without leaving URA.
          </Text>
        )}
        <Button
          title="Proceed to Pay"
          leftIcon={<Lock size={18} color={colors.white} />}
          onPress={onProceed}
          loading={placing || settingUp}
          disabled={!cart.items.length || belowMinimum || !shop.open}
        />
      </SafeAreaView>

      {/* Step 1: delivery. Step 2: payment type. */}
      <Sheet
        visible={chooser !== null}
        onClose={() => setChooser(null)}
        title={chooser === 'payment' ? 'How would you like to pay?' : 'How would you like to receive it?'}
      >
        {chooser === 'delivery' ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="body" muted>
              Choose a fulfilment method — this sets your total.
            </Text>
            <ChoiceCard
              icon={<Truck size={20} color={canDeliver ? colors.primary : colors.mutedLight} />}
              title="With Delivery"
              disabled={!canDeliver}
              sub={
                deliveryLoading
                  ? 'Getting delivery fee…'
                  : canDeliver
                    ? `${formatNaira(total)} + ${formatNaira(deliveryFee!)} delivery`
                    : deliveryError || 'Select your state first.'
              }
              right={canDeliver ? formatNaira(deliveryTotal) : undefined}
              loading={deliveryLoading}
              onPress={() => {
                setWithDelivery(true);
                setChooser('payment');
              }}
            />
            <ChoiceCard
              icon={<Store size={20} color={colors.primary} />}
              title="Without Delivery"
              sub="Pickup or arrange delivery yourself, no delivery fee"
              right={formatNaira(total)}
              onPress={() => {
                setWithDelivery(false);
                setChooser('payment');
              }}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <Pressable onPress={() => setChooser('delivery')} style={styles.inline} hitSlop={8}>
              <ChevronLeft size={16} color={colors.muted} />
              <Text variant="label" muted>
                Delivery
              </Text>
            </Pressable>
            <Text variant="body" muted>
              Total <Text weight="bold">{formatNaira(withDelivery ? deliveryTotal : total)}</Text> ·{' '}
              {withDelivery ? 'with delivery' : 'no delivery'}
            </Text>
            <ChoiceCard
              icon={<CreditCard size={20} color={colors.primary} />}
              title="Normal Payment"
              sub="No extra fee for you. Goes straight to the seller, so there is no buyer protection."
              onPress={() => void createOrderAndPay('normal')}
            />
            <ChoiceCard
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Buyer-Protected Payment"
              sub="Your money is held safely until you confirm you got your order (small fee)."
              onPress={() => void createOrderAndPay('protected')}
            />
          </View>
        )}
      </Sheet>

      <Sheet visible={statePicker} onClose={() => setStatePicker(false)} title="Select state">
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {NIGERIAN_STATES.map((s) => (
            <Pressable
              key={s}
              style={styles.stateRow}
              onPress={() => {
                setState(s);
                setStateError(null);
                setStatePicker(false);
              }}
            >
              <Text color={s === state ? colors.primary : colors.text} weight={s === state ? 'semibold' : 'regular'}>
                {s}
              </Text>
              {s === state ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>

      {transfer ? (
        <PaymentSheet
          orderId={transfer.orderId}
          orderNumber={transfer.orderNumber}
          payment={transfer.payment}
          businessId={sellerBusinessId}
          // Closing leaves the order unpaid; it can be paid from the order page.
          onClose={() => {
            const id = transfer.orderId;
            setTransfer(null);
            router.replace(`/order/${id}`);
          }}
          onPaid={() => {
            const id = transfer.orderId;
            setTransfer(null);
            void qc.invalidateQueries({ queryKey: ['orders'] });
            router.replace(`/order/${id}`);
          }}
        />
      ) : null}
    </View>
  );
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.stepNum}>
        <Text variant="small" color={colors.white}>
          {n}
        </Text>
      </View>
      <Text variant="subheading">{title}</Text>
    </View>
  );
}

function ChoiceCard({
  icon,
  title,
  sub,
  right,
  disabled,
  loading,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  right?: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.choice, disabled && { opacity: 0.55 }, pressed && !disabled && { borderColor: colors.primary }]}
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={styles.choiceIcon}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyMedium">{title}</Text>
        <View style={styles.inline}>
          {loading ? <ActivityIndicator size="small" color={colors.muted} /> : null}
          <Text variant="small" muted style={{ flex: 1 }}>
            {sub}
          </Text>
        </View>
      </View>
      {right ? <Text variant="bodyMedium">{right}</Text> : null}
      <ChevronRight size={18} color={colors.mutedLight} />
    </Pressable>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.summaryRow}>
      <Text muted={!bold} variant={bold ? 'subheading' : 'body'}>
        {label}
      </Text>
      <Text variant={bold ? 'subheading' : 'body'} color={bold ? colors.primary : colors.text}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radii.md, padding: spacing.md },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    backgroundColor: colors.surface,
  },
  payBox: {
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trust: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.floating },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
}));
