// Inventory (web pages/dashboard/Inventory → Stock tab): change stock, price
// and On/Off for many products, then save them together.
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Switch, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Package, Search } from 'lucide-react-native';
import { Button, EmptyState, Input, Text, useToast } from '@/components/ui';
import { fontFamily, fontSize, radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { getInventory, updateStock, type InventoryProduct, type StockEdit } from '@/api/inventory';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';

type Draft = { stock?: string; price?: string; isHidden?: boolean };

export default function InventoryScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    enabled: !!user?.isBusinessOwner,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data ?? [];
    return q
      ? list.filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
      : list;
  }, [data, query]);

  if (user && !user.isBusinessOwner) return <Redirect href="/become-seller" />;

  const edits: StockEdit[] = [];
  let invalid: string | null = null;
  for (const p of data ?? []) {
    const d = drafts[p._id];
    if (!d) continue;
    const e: StockEdit = { id: p._id };
    if (d.stock !== undefined && d.stock !== String(p.stock)) {
      const n = Number(d.stock);
      if (!Number.isInteger(n) || n < 0) invalid = `${p.name}: stock must be a whole number of 0 or more`;
      else e.stock = n;
    }
    if (d.price !== undefined && d.price !== String(p.price)) {
      const n = Number(d.price);
      if (!Number.isFinite(n) || n < 0 || d.price.trim() === '') invalid = `${p.name}: price must be 0 or more`;
      else e.price = n;
    }
    if (d.isHidden !== undefined && d.isHidden !== p.isHidden) e.isHidden = d.isHidden;
    if (Object.keys(e).length > 1) edits.push(e);
  }

  const setDraft = (id: string, patch: Draft) => setDrafts((all) => ({ ...all, [id]: { ...all[id], ...patch } }));

  const save = async () => {
    if (invalid) return toast.error(invalid);
    if (!edits.length) return;
    setSaving(true);
    try {
      for (let i = 0; i < edits.length; i += 200) await updateStock(edits.slice(i, i + 200));
      toast.success(`Saved ${edits.length} change${edits.length === 1 ? '' : 's'}.`);
      setDrafts({});
      await qc.invalidateQueries({ queryKey: ['inventory'] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={rows}
        keyExtractor={(p) => p._id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <Text variant="body" muted>
              Change stock, price or On/Off, then tap Save. Off hides a product from buyers.
            </Text>
            <Input
              placeholder="Search by name or SKU"
              value={query}
              onChangeText={setQuery}
              leftIcon={<Search size={16} color={colors.mutedLight} />}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => <Row p={item} draft={drafts[item._id]} onChange={(patch) => setDraft(item._id, patch)} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              icon={<Boxes size={30} color={colors.primary} />}
              title={isError ? 'Could not load your products' : 'No products yet'}
              message={isError ? 'Pull down to try again.' : 'Add your first product to start selling.'}
              actionLabel={isError ? undefined : 'Add a product'}
              onAction={isError ? undefined : () => router.push('/create-product')}
            />
          )
        }
      />
      {edits.length || invalid ? (
        <SafeAreaView edges={['bottom']} style={styles.bottom}>
          {invalid ? (
            <Text variant="small" color={colors.danger} style={{ marginBottom: spacing.sm }}>
              {invalid}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button title="Discard" variant="outline" onPress={() => setDrafts({})} disabled={saving} style={{ flex: 1 }} fullWidth={false} />
            <Button
              title={`Save ${edits.length} change${edits.length === 1 ? '' : 's'}`}
              onPress={() => void save()}
              loading={saving}
              disabled={!!invalid || !edits.length}
              style={{ flex: 2 }}
              fullWidth={false}
            />
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function Row({ p, draft, onChange }: { p: InventoryProduct; draft?: Draft; onChange: (d: Draft) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const hidden = draft?.isHidden ?? p.isHidden;
  const stock = draft?.stock ?? String(p.stock);
  const price = draft?.price ?? String(p.price);
  const changed = !!draft;
  return (
    <View style={[styles.card, changed && { borderColor: colors.primary }, hidden && { opacity: 0.7 }]}>
      <View style={styles.top}>
        {p.media[0] ? (
          <Image source={{ uri: p.media[0] }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Package size={18} color={colors.mutedLight} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" numberOfLines={2} onPress={() => router.push(`/edit-product/${p._id}`)}>
            {p.name}
          </Text>
          {p.sku ? (
            <Text variant="small" muted>
              SKU {p.sku}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Switch
            value={!hidden}
            onValueChange={(on) => onChange({ isHidden: !on })}
            trackColor={{ true: colors.success, false: colors.border }}
            accessibilityLabel={`${p.name} on sale`}
          />
          <Text variant="small" muted>
            {hidden ? 'Off' : 'On'}
          </Text>
        </View>
      </View>
      <View style={styles.fields}>
        <Field label="Stock" value={stock} onChange={(v) => onChange({ stock: v.replace(/\D/g, '') })} warn={Number(stock) === 0} />
        <Field label="Price (₦)" value={price} onChange={(v) => onChange({ price: v.replace(/[^\d.]/g, '') })} />
      </View>
    </View>
  );
}

function Field({ label, value, onChange, warn }: { label: string; value: string; onChange: (v: string) => void; warn?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text variant="small" muted>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[styles.input, warn && { borderColor: colors.warning }]}
        selectTextOnFocus
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { padding: spacing.lg, paddingBottom: 140, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  fields: { flexDirection: 'row', gap: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, ...shadow.floating },
}));
