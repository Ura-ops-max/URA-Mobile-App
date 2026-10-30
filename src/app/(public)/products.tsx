import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PackageSearch } from 'lucide-react-native';
import { Button, CategoryChip, EmptyState, Screen, Skeleton } from '@/components/ui';
import { ProductGridCard } from '@/components/ProductGridCard';
import { spacing, useTheme } from '@/theme';
import { fetchProductCategories, fetchProducts } from '@/api/feed';
import type { UnifiedPost } from '@/types';

export default function PublicProductsScreen() {
  const { colors } = useTheme();
  const [category, setCategory] = useState('All');
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchProductCategories });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['public-products', category],
    queryFn: ({ pageParam }) => fetchProducts(pageParam, category),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.length === 0 ? undefined : pages.length + 1),
  });
  const products: UnifiedPost[] = data?.pages.flat() ?? [];

  return (
    <Screen edges={[]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductGridCard post={item} />}
        ListHeaderComponent={
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...(categories ?? [])]}
            keyExtractor={(c) => c}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => (
              <CategoryChip label={item} active={category === item} showDot={item !== 'All'} onPress={() => setCategory(item)} />
            )}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={180} radius={14} style={styles.skel} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<PackageSearch size={32} color={colors.primary} />}
              title="No products found"
              actionLabel="Sign in to sell"
              onAction={() => router.push('/(auth)/login')}
            />
          )
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          <Button title="Create an account" onPress={() => router.push('/(auth)/register')} style={{ margin: spacing.lg }} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  row: { gap: spacing.md, marginBottom: spacing.md },
  chips: { gap: spacing.sm, paddingVertical: spacing.md },
  skeletons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skel: { width: '47%' },
});
