import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Building2, MapPin, Package } from 'lucide-react-native';
import { Badge, CategoryChip, PriceTag, Rating, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import type { AISearchResult } from '@/types';

export function AISearchResultCard({ result, variant = 'row' }: { result: AISearchResult; variant?: 'row' | 'grid' }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isBusiness = result.type === 'business';
  const open = () => router.push(isBusiness ? `/business/${result.id}` : `/product/${result.id}`);

  if (variant === 'grid') {
    return (
      <Pressable style={styles.gridCard} onPress={open}>
        <View style={styles.gridImgWrap}>
          {result.image ? (
            <Image source={{ uri: result.image }} style={styles.gridImg} contentFit="cover" transition={150} />
          ) : (
            <Package size={26} color={colors.mutedLight} />
          )}
          {result.score > 0 ? (
            <View style={styles.matchPill}>
              <Text variant="small" color={colors.white}>{Math.round(result.score * 100)}%</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.gridBody}>
          <Text variant="label" numberOfLines={1}>{result.name}</Text>
          {result.subtitle ? <Text variant="small" muted numberOfLines={1}>{result.subtitle}</Text> : null}
          <View style={styles.gridMeta}>
            {result.price !== null ? <PriceTag amount={result.price} size="sm" color={colors.primary} /> : null}
            {result.rating ? <Rating value={result.rating} size={11} /> : null}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={open}>
      <View style={styles.thumb}>
        {result.image ? (
          <Image source={{ uri: result.image }} style={styles.thumbImg} contentFit="cover" transition={150} />
        ) : isBusiness ? (
          <Building2 size={22} color={colors.mutedLight} />
        ) : (
          <Package size={22} color={colors.mutedLight} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{result.name}</Text>
          <Badge label={isBusiness ? 'Business' : 'Product'} tone={isBusiness ? 'info' : 'success'} />
        </View>
        {result.description ? (
          <Text variant="small" muted numberOfLines={2}>{result.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {result.price !== null ? <PriceTag amount={result.price} size="sm" color={colors.primary} /> : null}
          {result.subtitle ? <CategoryChip label={result.subtitle} size="sm" /> : null}
          {result.rating ? <Rating value={result.rating} size={11} showValue /> : null}
          {result.inStock === false ? <Badge label="Out of stock" tone="danger" /> : null}
        </View>
        {result.location ? (
          <View style={styles.locRow}>
            <MapPin size={12} color={colors.mutedLight} />
            <Text variant="small" muted numberOfLines={1}>{result.location}</Text>
          </View>
        ) : null}
        {result.score > 0 ? (
          <Text variant="small" color={colors.mutedLight} style={styles.match}>
            {Math.round(result.score * 100)}% match
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg },
  thumb: { width: 60, height: 60, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  match: { alignSelf: 'flex-start' },
  gridCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  gridImgWrap: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  gridImg: { width: '100%', height: '100%' },
  matchPill: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  gridBody: { padding: spacing.sm, gap: 2 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
}));

