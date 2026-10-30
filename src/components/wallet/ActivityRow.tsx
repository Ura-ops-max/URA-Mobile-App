import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react-native';
import { Badge, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';
import { formatMoney, formatDateTime } from '@/lib/money';
import type { WalletActivityRow } from '@/types';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  Success: 'success',
  Released: 'success',
  Pending: 'warning',
  Held: 'info',
  Failed: 'danger',
};

/** One money row: type, amount, status, details, date. Rows of an order open that order. */
export function ActivityRow({ row }: { row: WalletActivityRow }) {
  const { colors } = useTheme();
  const credit = row.direction === 'credit';
  const body = (
    <>
      <View style={[styles.icon, { backgroundColor: credit ? colors.successSoft : colors.dangerSoft }]}>
        {credit ? <ArrowDownLeft size={16} color={colors.success} /> : <ArrowUpRight size={16} color={colors.danger} />}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.top}>
          <Text variant="bodyMedium">{row.type}</Text>
          <Text variant="bodyMedium" color={credit ? colors.success : colors.text}>
            {credit ? '+' : '-'}
            {formatMoney(row.amount, row.currency)}
          </Text>
        </View>
        <View style={styles.meta}>
          <Badge label={row.status} tone={STATUS_TONE[row.status] ?? 'neutral'} />
          {row.fee > 0 ? (
            <Text variant="small" muted>
              Fee {formatMoney(row.fee, row.currency)}
            </Text>
          ) : null}
        </View>
        <Text variant="small" muted numberOfLines={2}>
          {row.details}
        </Text>
        <Text variant="small" color={colors.mutedLight}>
          {formatDateTime(row.date)}
        </Text>
      </View>
      {row.orderId ? <ChevronRight size={16} color={colors.mutedLight} /> : null}
    </>
  );
  return row.orderId ? (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/order/${row.orderId}`)}
      accessibilityLabel={`${row.type}, ${row.details}`}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
