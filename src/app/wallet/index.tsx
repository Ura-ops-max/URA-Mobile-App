// Wallet overview (web WalletOverviewPage): Available, Held in Buyer-Protected,
// and the latest money rows. No "Fund Wallet": shoppers pay by card at checkout.
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Briefcase, ChevronRight, History, ShieldCheck, Wallet } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { ActivityRow } from '@/components/wallet/ActivityRow';
import { useAuthContext } from '@/context/auth-provider';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatMoney } from '@/lib/money';
import { getWallet, getWalletActivity } from '@/api/wallet';

export default function WalletOverviewScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuthContext();
  const hasProfile = !!user?.paylukCustomerId;
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getWallet, enabled: !!user });
  const recent = useQuery({
    queryKey: ['wallet', 'activity', 1, 5],
    queryFn: () => getWalletActivity(1, 5),
    enabled: hasProfile,
  });

  if (!hasProfile) {
    return (
      <View style={styles.gate}>
        <View style={styles.gateIcon}>
          <ShieldCheck size={30} color={colors.primary} />
        </View>
        <Text variant="subheading" center>
          Set up your wallet
        </Text>
        <Text variant="body" muted center style={{ maxWidth: 300 }}>
          Set up your payment profile to get paid for your sales and withdraw to your bank.
        </Text>
        <Button title="Set up payments" onPress={() => router.push('/payluk-setup')} style={{ marginTop: spacing.lg }} fullWidth={false} />
      </View>
    );
  }

  const w = wallet.data;
  const rows = recent.data?.data ?? [];
  const refresh = () => {
    void wallet.refetch();
    void recent.refetch();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={wallet.isRefetching || recent.isRefetching} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <BalanceCard
        icon={<Wallet size={18} color={colors.primary} />}
        label="Available"
        amount={wallet.isLoading ? null : formatMoney(w?.mainBalance, w?.currency)}
        description="Money you can withdraw."
      />
      <Pressable onPress={() => router.push('/wallet/held')} accessibilityLabel="See the orders holding this money">
        <BalanceCard
          icon={<Briefcase size={18} color={colors.primary} />}
          label="Held in Buyer-Protected"
          amount={wallet.isLoading ? null : formatMoney(w?.escrowBalance, w?.currency)}
          description="Money waiting for the buyer to confirm delivery. Tap to see the orders."
          chevron
        />
      </Pressable>

      <View style={styles.actions}>
        <Button
          title="Withdraw Funds"
          leftIcon={<ArrowUpRight size={18} color={colors.white} />}
          onPress={() => router.push('/wallet/withdraw')}
          style={{ flex: 1 }}
          fullWidth={false}
        />
        <Button
          title="History"
          variant="outline"
          leftIcon={<History size={18} color={colors.text} />}
          onPress={() => router.push('/wallet/transactions')}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>

      <View style={styles.sectionHead}>
        <Text variant="label" muted>
          RECENT TRANSACTIONS
        </Text>
        <Text variant="label" color={colors.primary} onPress={() => router.push('/wallet/transactions')}>
          View all
        </Text>
      </View>
      {recent.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" muted>
            No transactions yet
          </Text>
          <Text variant="small" muted>
            Your payments and withdrawals will show here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((r, i) => (
            <View key={r.id || i} style={i > 0 ? styles.sep : undefined}>
              <ActivityRow row={r} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function BalanceCard({
  icon,
  label,
  amount,
  description,
  chevron,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string | null;
  description: string;
  chevron?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>{icon}</View>
        <Text variant="subheading" style={{ flex: 1 }}>
          {label}
        </Text>
        {chevron ? <ChevronRight size={18} color={colors.mutedLight} /> : null}
      </View>
      {amount === null ? (
        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
      ) : (
        <Text variant="display" color={colors.primary}>
          {amount}
        </Text>
      )}
      <Text variant="small" muted>
        {description}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm, backgroundColor: colors.background },
  gateIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: 4 },
}));
