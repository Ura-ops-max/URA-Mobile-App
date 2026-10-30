// Shared list for My Orders and Shop Orders: tabs with counts, then cards.
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { EmptyState, Text } from '@/components/ui';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import type { ListOrder } from '@/types';
import { OrderCard } from './OrderCard';

export function OrderList<T extends string>({
  subtitle,
  tabs,
  tabOf,
  orders,
  loading,
  error,
  refreshing,
  empty,
  onRefresh,
  initialTab,
}: {
  subtitle: string;
  tabs: { key: T; label: string }[];
  tabOf: (o: ListOrder) => T;
  orders: ListOrder[] | undefined;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  empty: Record<T, string>;
  onRefresh: () => void;
  initialTab?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<T>(
    (tabs.find((t) => t.key === initialTab)?.key ?? tabs[0].key) as T,
  );

  const counts = useMemo(() => {
    const c = Object.fromEntries(tabs.map((t) => [t.key, 0])) as Record<T, number>;
    for (const o of orders ?? []) c[tabOf(o)]++;
    return c;
  }, [orders, tabs, tabOf]);

  const shown = (orders ?? []).filter((o) => tabOf(o) === tab);

  return (
    <FlatList
      data={loading || error ? [] : shown}
      keyExtractor={(o) => o._id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
          <Text variant="body" muted>
            {subtitle}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {tabs.map((t) => {
              const active = t.key === tab;
              const n = counts[t.key];
              return (
                <Pressable
                  key={t.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTab(t.key)}
                  style={[styles.tab, active ? styles.tabActive : null]}
                >
                  <Text style={[styles.tabText, { color: active ? colors.white : colors.muted }]}>{t.label}</Text>
                  {n > 0 ? (
                    <View
                      style={[
                        styles.count,
                        {
                          backgroundColor: active
                            ? 'rgba(255,255,255,0.2)'
                            : t.key === 'problems'
                              ? colors.dangerSoft
                              : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.countText,
                          { color: active ? colors.white : t.key === 'problems' ? colors.danger : colors.muted },
                        ]}
                      >
                        {n}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => <OrderCard order={item} onChanged={onRefresh} />}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <EmptyState
            icon={<Package size={30} color={colors.primary} />}
            title="Could not load your orders"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={onRefresh}
          />
        ) : (
          <EmptyState icon={<Package size={30} color={colors.primary} />} title="Nothing here" message={empty[tab]} />
        )
      }
    />
  );
}

const useStyles = makeStyles((colors) => ({
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm },
  count: { borderRadius: radii.pill, paddingHorizontal: 6, minWidth: 20, alignItems: 'center' },
  countText: { fontFamily: fontFamily.semibold, fontSize: 11 },
}));
