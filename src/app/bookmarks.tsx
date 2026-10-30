import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react-native';
import { Avatar, EmptyState, Rating, Screen, Tabs, Text } from '@/components/ui';
import { ProductGridCard } from '@/components/ProductGridCard';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { fetchBookmarkedBusinesses, fetchBookmarkedPosts } from '@/api/bookmarks';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<'businesses' | 'products'>('businesses');
  const { data: businesses } = useQuery({ queryKey: ['bookmarks', 'businesses'], queryFn: fetchBookmarkedBusinesses });
  const { data: products } = useQuery({ queryKey: ['bookmarks', 'products'], queryFn: fetchBookmarkedPosts });

  return (
    <Screen padded>
      <View style={styles.tabs}>
        <Tabs
          variant="pill"
          value={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            { key: 'businesses', label: `Businesses` },
            { key: 'products', label: `Products` },
          ]}
        />
      </View>
      {tab === 'businesses' ? (
        <FlatList
          data={businesses ?? []}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
          renderItem={({ item }) => (
            <Pressable style={styles.bizRow} onPress={() => router.push(`/business/${item._id}`)}>
              <Avatar uri={item.businessLogo} name={item.businessName} size={54} verified />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{item.businessName}</Text>
                <Text variant="small" muted numberOfLines={1}>{item.category} · {item.address}</Text>
                <Rating value={item.averageRating} count={item.totalReviews} size={12} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState icon={<Bookmark size={30} color={colors.primary} />} title="No saved businesses" message="Bookmark businesses to find them here." />}
        />
      ) : (
        <FlatList
          data={products ?? []}
          keyExtractor={(p) => p._id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
          renderItem={({ item }) => <ProductGridCard post={item} />}
          ListEmptyComponent={<EmptyState icon={<Bookmark size={30} color={colors.primary} />} title="No saved products" message="Tap the bookmark icon on a product to save it." />}
        />
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  tabs: { paddingVertical: spacing.sm, alignItems: 'flex-start' },
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },
}));
