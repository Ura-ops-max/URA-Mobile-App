// Withdraw Funds (web WithdrawalPage): pick a bank → account number (checked
// automatically at 10 digits) + amount → review and confirm (with an OTP if
// Payluk asks for one, on the same reference) → done.
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Landmark, Search } from 'lucide-react-native';
import { Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatMoney } from '@/lib/money';
import { confirmWithdrawal, getBankList, getWallet, startWithdrawal, verifyAccount } from '@/api/wallet';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';
import type { BankOption } from '@/types';
import { useSubmitLock } from '@/hooks/use-submit-lock';

type Step = 'bank' | 'details' | 'review' | 'done';
const STEP_LABEL: Record<Step, string> = { bank: 'Select Bank', details: 'Account Details', review: 'Confirm', done: 'Done' };

interface Intent {
  reference: string;
  amount: number;
  fee: number;
  status: string;
}

export default function WithdrawScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: getBankList,
    staleTime: 60 * 60_000,
  });
  const mainBalance = wallet?.mainBalance ?? 0;

  const [step, setStep] = useState<Step>('bank');
  const [query, setQuery] = useState('');
  const [bank, setBank] = useState<BankOption | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.includes(q)) : banks;
  }, [banks, query]);

  // Check the account as soon as it has 10 digits.
  const account = useQuery({
    queryKey: ['verify-account', bank?.code, accountNumber],
    queryFn: () => verifyAccount(bank!.code, accountNumber),
    enabled: !!bank && accountNumber.length === 10,
    staleTime: 10 * 60_000,
    retry: false,
  });
  const verifying = account.isFetching;
  const accountName = accountNumber.length === 10 && account.data?.accountName ? account.data.accountName : '';
  const accountError =
    accountNumber.length === 10 && !verifying
      ? account.isError
        ? apiErrorMessage(account.error, 'Account verification failed.')
        : account.data && !account.data.accountName
          ? 'Could not retrieve account name'
          : undefined
      : undefined;

  const amt = Number(amount) || 0;
  const tooLow = amount !== '' && amt < 100;
  const tooHigh = amt > mainBalance;

  const lock = useSubmitLock();
  const createIntent = () =>
    lock(async () => {
      if (!bank || !accountName || tooLow || tooHigh || !amt) return;
      setBusy(true);
      try {
        const r = await startWithdrawal({
          amount: amt,
          accountName,
          accountNumber,
          bankName: bank.name,
          bankCode: bank.code,
        });
        setIntent({ reference: r.reference, amount: Number(r.amount) || amt, fee: Number(r.fee) || 0, status: r.status });
        setStep('review');
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Failed to create withdrawal.'));
      } finally {
        setBusy(false);
      }
    });

  const confirm = () =>
    lock(async () => {
      if (!intent) return;
      setBusy(true);
      try {
        const r = await confirmWithdrawal(intent.reference, otp.trim() || undefined);
        setIntent({ ...intent, status: r.status ?? intent.status, amount: Number(r.amount) || intent.amount, fee: Number(r.fee) || intent.fee });
        setNeedsOtp(false);
        setOtp('');
        setStep('done');
        void qc.invalidateQueries({ queryKey: ['wallet'] });
        toast.success('Withdrawal processed successfully!');
      } catch (err) {
        const msg = apiErrorMessage(err, '');
        // Payluk asked for a code: show the OTP field and retry the same reference.
        if (/otp|pin|confirm|code/i.test(msg)) {
          setNeedsOtp(true);
          toast.error(msg || 'Enter the OTP sent to you to confirm this withdrawal.');
        } else {
          toast.error(msg || 'Failed to confirm withdrawal.');
        }
      } finally {
        setBusy(false);
      }
    });

  if (!user?.paylukCustomerId) {
    return (
      <View style={styles.center}>
        <Text variant="bodyMedium">Payment profile not set up</Text>
        <Button title="Set up payments" fullWidth={false} onPress={() => router.replace('/payluk-setup')} />
      </View>
    );
  }

  const header = (
    <View style={styles.steps}>
      {(['bank', 'details', 'review'] as Step[]).map((s, i) => {
        const idx = (['bank', 'details', 'review', 'done'] as Step[]).indexOf(step);
        const done = i < idx;
        const current = i === idx;
        return (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.dot, { backgroundColor: done ? colors.primary : current ? colors.text : colors.surfaceAlt }]}>
              {done ? (
                <Check size={12} color={colors.white} />
              ) : (
                <Text variant="small" color={current ? colors.white : colors.mutedLight}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < 2 ? <View style={[styles.line, { backgroundColor: done ? colors.primary : colors.surfaceAlt }]} /> : null}
          </View>
        );
      })}
      <Text variant="small" muted style={{ marginLeft: spacing.sm }}>
        {STEP_LABEL[step].toUpperCase()}
      </Text>
    </View>
  );

  if (step === 'bank') {
    return (
      <FlatList
        data={filtered}
        keyExtractor={(b) => `${b.code}-${b.name}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <Text variant="body" muted>
              Select your destination bank account
            </Text>
            {header}
            <Input
              placeholder="Search bank name or code…"
              value={query}
              onChangeText={setQuery}
              leftIcon={<Search size={16} color={colors.mutedLight} />}
              autoCorrect={false}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const selected = bank?.code === item.code && bank?.name === item.name;
          return (
            <Pressable
              style={[styles.bank, selected && styles.bankSelected]}
              onPress={() => {
                setBank(item);
                setStep('details');
              }}
            >
              <View style={[styles.bankIcon, selected && { backgroundColor: colors.primary }]}>
                <Text variant="small" color={selected ? colors.white : colors.muted}>
                  {item.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                {item.name}
              </Text>
              {selected ? <Check size={16} color={colors.primary} /> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          banksLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : (
            <Text variant="body" muted center style={{ marginTop: 32 }}>
              No banks match your search.
            </Text>
          )
        }
      />
    );
  }

  if (step === 'details') {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {header}
        <View style={styles.balance}>
          <Text variant="small" muted>
            Available balance
          </Text>
          <Text variant="title" color={colors.primary}>
            {formatMoney(mainBalance, wallet?.currency)}
          </Text>
        </View>
        <Pressable style={styles.bank} onPress={() => setStep('bank')}>
          <View style={styles.bankIcon}>
            <Landmark size={16} color={colors.muted} />
          </View>
          <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
            {bank?.name}
          </Text>
          <Text variant="label" color={colors.primary}>
            Change
          </Text>
        </Pressable>
        <Input
          label="Account number"
          placeholder="10-digit account number"
          keyboardType="number-pad"
          maxLength={10}
          value={accountNumber}
          onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
          hint={verifying ? 'Checking account…' : undefined}
          error={accountError}
        />
        {accountName ? (
          <View style={styles.verified}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text weight="semibold" color={colors.success}>
              {accountName}
            </Text>
          </View>
        ) : null}
        <Input
          label="Amount"
          placeholder="0"
          keyboardType="number-pad"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))}
          leftIcon={<Text color={colors.muted}>₦</Text>}
          error={
            tooHigh
              ? `Insufficient balance. Your main balance is ${formatMoney(mainBalance)}.`
              : tooLow
                ? 'The minimum withdrawal is ₦100.'
                : undefined
          }
        />
        <Button
          title="Continue"
          onPress={createIntent}
          loading={busy}
          disabled={!accountName || !amt || tooLow || tooHigh || verifying}
        />
      </ScrollView>
    );
  }

  if (step === 'review' && intent) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {header}
        <View style={styles.card}>
          <Row label="Amount" value={formatMoney(intent.amount)} />
          {intent.fee > 0 ? <Row label="Fee" value={formatMoney(intent.fee)} /> : null}
          <Row label="Bank" value={bank?.name ?? ''} />
          <Row label="Account" value={`${accountName} · ${accountNumber}`} />
        </View>
        {needsOtp ? (
          <Input
            label="Confirmation code (OTP)"
            placeholder="Enter the code sent to you"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={8}
          />
        ) : null}
        <Button title="Confirm withdrawal" onPress={confirm} loading={busy} disabled={needsOtp && !otp.trim()} />
        <Button title="Back" variant="outline" onPress={() => setStep('details')} disabled={busy} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.center}>
      <CheckCircle2 size={64} color={colors.success} />
      <Text variant="title" center>
        Withdrawal {intent?.status === 'pending' ? 'on its way' : 'sent'}
      </Text>
      <Text variant="body" muted center style={{ maxWidth: 300 }}>
        {formatMoney(intent?.amount ?? 0)} to {accountName} ({bank?.name}).
      </Text>
      <Button title="Back to wallet" onPress={() => router.replace('/wallet')} fullWidth={false} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text variant="body" muted>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl, backgroundColor: colors.background, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  steps: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  line: { width: 28, height: 2, borderRadius: 1, marginHorizontal: 6 },
  bank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  bankSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  bankIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  balance: { backgroundColor: colors.primarySoft, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', gap: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
}));
