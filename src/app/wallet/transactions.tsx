
// Transaction History (web TransactionHistoryPage): payments, refunds and
// withdrawals, page by page from GET /wallet/activity.
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, History } from 'lucide-react-native';
import { Button, EmptyState, Text } from '@/components/ui';
import { ActivityRow } from '@/components/wallet/ActivityRow';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { getWalletActivity } from '@/api/wallet';
import { apiErrorMessage } from '@/api/orders';

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['wallet', 'activity', page, PAGE_SIZE],
    queryFn: () => getWalletActivity(page, PAGE_SIZE),
  });
  const rows = data?.data ?? [];
  const p = data?.pagination;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r, i) => r.id || String(i)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      ListHeaderComponent={
        p?.count != null ? (
          <Text variant="small" muted style={{ marginBottom: spacing.sm }}>
            {p.count} transaction{p.count !== 1 ? 's' : ''}
          </Text>
        ) : undefined
      }
      renderItem={({ item, index }) => (
        <View style={[styles.item, index === 0 && styles.first, index === rows.length - 1 && styles.last, index > 0 && styles.sep]}>
          <ActivityRow row={item} />
        </View>
      )}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <EmptyState
            icon={<History size={30} color={colors.primary} />}
            title={isError ? 'Could not load your transactions' : 'No transactions yet'}
            message={isError ? apiErrorMessage(error, 'Please try again.') : 'Your payments and withdrawals will show here.'}
            actionLabel={isError ? 'Try again' : undefined}
            onAction={isError ? () => void refetch() : undefined}
          />
        )
      }
      ListFooterComponent={
        p && p.pages > 1 ? (
          <View style={styles.pager}>
            <Button
              title="Previous"
              variant="outline"
              size="sm"
              fullWidth={false}
              disabled={page <= 1}
              leftIcon={<ChevronLeft size={16} color={colors.text} />}
              onPress={() => setPage((n) => Math.max(1, n - 1))}
            />
            <Text variant="small" muted>
              Page {page} of {p.pages}
            </Text>
            <Button
              title="Next"
              variant="outline"
              size="sm"
              fullWidth={false}
              disabled={p.isLastPage}
              rightIcon={<ChevronRight size={16} color={colors.text} />}
              onPress={() => setPage((n) => n + 1)}
            />
          </View>
        ) : undefined
      }
    />
  );
}

const useStyles = makeStyles((colors) => ({
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  item: { backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  first: { borderTopWidth: 1, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  last: { borderBottomWidth: 1, borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
}));
