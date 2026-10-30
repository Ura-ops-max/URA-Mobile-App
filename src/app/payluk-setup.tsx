import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, ShieldCheck, Wallet, Zap } from 'lucide-react-native';
import { Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { setupPaymentProfile } from '@/api/wallet';
import { NG_PHONE } from '@/hooks/use-payment-profile';

const BENEFITS = [
  { icon: ShieldCheck, title: 'Buyer-Protected Payment', text: 'Buyers pay with confidence; money is released when they confirm delivery.' },
  { icon: Wallet, title: 'Instant payouts', text: 'Withdraw your sales to any Nigerian bank in minutes.' },
  { icon: Zap, title: 'Faster checkout', text: 'One-tap payments for returning customers.' },
];

export default function PaylukSetupScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { user, refetchAuth } = useAuthContext();
  const [step, setStep] = useState<'intro' | 'form' | 'done'>(user?.paylukCustomerId ? 'done' : 'intro');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const activate = async () => {
    if (!NG_PHONE.test(phone.trim())) return toast.error('Enter a valid Nigerian phone number (e.g. 08012345678)');
    setLoading(true);
    try {
      await setupPaymentProfile({ phone: phone.trim() });
      await refetchAuth();
      setStep('done');
      toast.success('Payment profile created');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Could not set up payments');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <View style={styles.doneWrap}>
        <CheckCircle2 size={72} color={colors.success} />
        <Text variant="title" center>You&apos;re all set!</Text>
        <Text variant="body" muted center style={{ maxWidth: 300 }}>
          Your payment profile is active. You can now pay, get paid for your sales, and withdraw to your bank.
        </Text>
        <Button title="Go to wallet" onPress={() => router.replace('/wallet')} style={{ marginTop: spacing.lg }} />
        <Button title="Done" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  if (step === 'form') {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text variant="heading">Activate your wallet</Text>
        <Text variant="body" muted>Confirm your phone number to create your Payluk payment profile.</Text>
        <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08012345678" maxLength={11} hint="Your Nigerian number, e.g. 08012345678." />
        <Button title="Activate wallet" onPress={activate} loading={loading} disabled={!NG_PHONE.test(phone.trim())} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Wallet size={32} color={colors.primary} />
        </View>
        <Text variant="title" center>Set up payments with Payluk</Text>
        <Text variant="body" muted center style={{ maxWidth: 320 }}>
          Pay safely, get paid for your sales, and withdraw to your bank.
        </Text>
      </View>
      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <b.icon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{b.title}</Text>
              <Text variant="small" muted>{b.text}</Text>
            </View>
          </View>
        ))}
      </View>
      <Button title="Get started" onPress={() => setStep('form')} />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroIcon: { width: 72, height: 72, borderRadius: radii.xxl, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  benefits: { gap: spacing.md, marginBottom: spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg },
  benefitIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  doneWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
}));
