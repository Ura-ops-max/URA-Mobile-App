// Orders whose money is held in Buyer-Protected right now (web HeldOrdersPage).
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatDateTime, formatMoney, toDate } from '@/lib/money';
import { getHeldOrders } from '@/api/wallet';
import type { HeldOrder } from '@/types';

export default function HeldOrdersScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wallet', 'held'],
    queryFn: getHeldOrders,
  });
  const sales = orders.filter((o) => o.role === 'seller');
  const purchases = orders.filter((o) => o.role === 'buyer');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
    >
      <Text variant="body" muted>
        Money waiting for the buyer to confirm delivery.
      </Text>
      {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
      {!isLoading && orders.length === 0 ? (
        <Text variant="body" muted center style={{ marginTop: 40 }}>
          No money is held right now.
        </Text>
      ) : null}
      {sales.length > 0 ? <Section title="YOUR SALES" rows={sales} /> : null}
      {purchases.length > 0 ? <Section title="YOUR PURCHASES" rows={purchases} /> : null}
    </ScrollView>
  );
}

function Section({ title, rows }: { title: string; rows: HeldOrder[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      <Text variant="label" muted>
        {title}
      </Text>
      <View style={styles.list}>
        {rows.map((o, i) => {
          const release = toDate(o.autoReleaseAt);
          return (
            <Pressable
              key={o.orderId}
              style={[styles.row, i > 0 && styles.sep]}
              onPress={() => router.push(`/order/${o.orderId}`)}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.top}>
                  <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                    {o.role === 'seller' ? `From ${o.name}` : `To ${o.name}`}
                  </Text>
                  <Text variant="bodyMedium">{formatMoney(o.amount)}</Text>
                </View>
                <Text variant="small" color={colors.mutedLight}>
                  {o.orderNumber}
                </Text>
                <Text variant="small" muted>
                  {o.problem
                    ? 'A problem was reported. Payment is on hold.'
                    : release
                      ? `${o.role === 'seller' ? 'Money arrives' : 'Paid to the shop'} on ${formatDateTime(release, false)} unless a problem is reported`
                      : 'Waiting for the buyer to confirm delivery'}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedLight} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl },
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  top: { flexDirection: 'row', gap: spacing.sm },
}));
