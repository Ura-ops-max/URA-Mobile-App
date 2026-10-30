import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PackageSearch, Sparkles } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { FeedCard } from '@/components/FeedCard';
import { useScrollToTop } from '@/components/ScrollTopButton';
import { Screen, Text, CategoryChip, SkeletonCard, EmptyState, Button } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';
import { fetchFeed, fetchProductCategories } from '@/api/feed';
import type { UnifiedPost } from '@/types';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [category, setCategory] = useState('All');
  const { ref: listRef, onScroll, button: scrollTopButton } = useScrollToTop<UnifiedPost>();

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchProductCategories });

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', category],
    queryFn: ({ pageParam }) => fetchFeed(pageParam, category),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage.length === 0 ? undefined : pages.length + 1),
  });

  const posts: UnifiedPost[] = data?.pages.flat() ?? [];

  const renderHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.dealsBanner}>
          <View style={styles.dealsText}>
            <Text variant="subheading" color={colors.white}>
              Deals & Offers 🔥
            </Text>
            <Text variant="caption" color="#FFE9DE">
              Save big on featured products today
            </Text>
          </View>
          <Button
            title="View"
            variant="secondary"
            size="sm"
            fullWidth={false}
            leftIcon={<Sparkles size={16} color={colors.primary} />}
            onPress={() => router.push('/deals')}
          />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...(categories ?? [])]}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <CategoryChip
              label={item}
              active={category === item}
              showDot={item !== 'All'}
              onPress={() => setCategory(item)}
            />
          )}
        />
      </View>
    ),
    [categories, category, colors, styles],
  );

  return (
    <Screen edges={['top']}>
      <AppHeader showLogo />
      {isLoading ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={<PackageSearch size={32} color={colors.primary} />}
          title="Couldn't load your feed"
          message="Something went wrong. Pull to refresh or try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          ref={listRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FeedCard post={item} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          ListEmptyComponent={
            <EmptyState
              icon={<PackageSearch size={32} color={colors.primary} />}
              title="Nothing here yet"
              message="No posts in this category. Check back soon!"
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? <View style={styles.footer}><SkeletonCard /></View> : <View style={{ height: 20 }} />
          }
        />
      )}
      {scrollTopButton}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  listHeader: { gap: spacing.md, marginBottom: spacing.md },
  skeletons: { padding: spacing.lg, gap: spacing.md },
  dealsBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dealsText: { gap: 2, flex: 1 },
  chipsRow: { gap: spacing.sm, paddingVertical: 2 },
  footer: { paddingTop: spacing.md },
}));
