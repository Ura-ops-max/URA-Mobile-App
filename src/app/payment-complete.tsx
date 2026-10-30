// Where a finished Payluk payment lands (?orderId=). Only URA's backend
// decides an order is paid, so this asks GET /orders/:id/payment-status
// until it is (or stops after 3 minutes), then opens the order.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';
import { getPaymentStatus } from '@/api/orders';

const POLL_MS = 4_000;
const POLL_FOR_MS = 3 * 60_000;

export default function PaymentCompleteScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<'checking' | 'paid' | 'slow'>('checking');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const until = Date.now() + POLL_FOR_MS;
    const check = async () => {
      try {
        const s = await getPaymentStatus(orderId);
        if (!active) return;
        if (s.paymentStatus === 'paid') {
          setPhase('paid');
          void qc.invalidateQueries({ queryKey: ['orders'] });
          void qc.invalidateQueries({ queryKey: ['order', orderId] });
          return;
        }
      } catch {
        /* keep waiting */
      }
      if (!active) return;
      if (Date.now() >= until) return setPhase('slow');
      timer.current = setTimeout(() => void check(), POLL_MS);
    };
    void check();
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [orderId, qc]);

  if (!orderId) {
    return (
      <View style={styles.wrap}>
        <Text variant="subheading">Payment</Text>
        <Button title="Go to my orders" fullWidth={false} onPress={() => router.replace('/orders')} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {phase === 'checking' ? (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text variant="subheading">Confirming your payment...</Text>
          <Text variant="body" muted center>
            This usually takes a few seconds.
          </Text>
        </>
      ) : phase === 'paid' ? (
        <>
          <CheckCircle2 size={64} color={colors.success} />
          <Text variant="title">Payment confirmed!</Text>
          <Text variant="body" muted center>
            Your order is being processed.
          </Text>
        </>
      ) : (
        <>
          <Clock size={56} color={colors.warning} />
          <Text variant="subheading" center>
            We&apos;re still confirming your payment
          </Text>
          <Text variant="body" muted center>
            You&apos;ll get a notice as soon as it&apos;s confirmed. You don&apos;t need to pay again.
          </Text>
        </>
      )}
      <Button title="Go to my order" fullWidth={false} onPress={() => router.replace(`/order/${orderId}`)} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
}));
