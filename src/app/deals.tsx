// Deals & Offers (web pages/dashboard/Deals&Offer): the best products from
// verified businesses — GET /products, 15 a page, with category pills.
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react-native';
import { EmptyState, SkeletonCard, Text } from '@/components/ui';
import { ProductGridCard } from '@/components/ProductGridCard';
import { fontFamily, radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { fetchProductCategories, fetchProducts, PRODUCTS_PAGE_SIZE } from '@/api/feed';

export default function DealsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [category, setCategory] = useState('All');
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchProductCategories,
    staleTime: 30 * 60_000,
  });
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['deals', category],
      queryFn: ({ pageParam }) => fetchProducts(pageParam, category),
      initialPageParam: 1,
      getNextPageParam: (last, all) => (last.length < PRODUCTS_PAGE_SIZE ? undefined : all.length + 1),
    });
  const items = data?.pages.flat() ?? [];

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={items}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <ProductGridCard post={item} />
        </View>
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => hasNextPage && !isFetchingNextPage && void fetchNextPage()}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Tag size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">Deals & Offers</Text>
              <Text variant="small" muted>
                Explore the best products from verified businesses
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {['All', ...categories].map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.pill, active && styles.pillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.pillText, { color: active ? colors.white : colors.muted }]}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <EmptyState
            icon={<Tag size={30} color={colors.primary} />}
            title={isError ? 'Could not load products' : category !== 'All' ? `No ${category} items` : 'No products yet'}
            message={isError ? 'Pull down to try again.' : 'Try selecting a different category or check back later.'}
          />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} /> : undefined}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  header: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.lg,
    ...shadow.card,
    shadowOpacity: 0.04,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titleIcon: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  pills: { gap: spacing.sm, paddingRight: spacing.sm },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontFamily: fontFamily.semibold, fontSize: 12 },
  skeletons: { gap: spacing.md },
}));
