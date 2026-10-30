import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, ImagePlus, X } from 'lucide-react-native';
import { Button, Input, Sheet, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { fetchProductCategories } from '@/api/feed';
import type { ProductInput } from '@/api/products';

interface ProductFormProps {
  initial?: Partial<ProductInput>;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
}

export function ProductForm({ initial, submitLabel, onSubmit }: ProductFormProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchProductCategories });
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : '');
  const [stock, setStock] = useState(initial?.stock ? String(initial.stock) : '');
  const [size, setSize] = useState(initial?.size ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [media, setMedia] = useState<string[]>(initial?.media ?? []);
  const [catPicker, setCatPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Photo permission needed');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 5 });
    if (!res.canceled) {
      setMedia((m) => [...m, ...res.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const submit = async () => {
    if (!name || !price || !category) {
      toast.error('Please fill in name, price and category');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        price: Number(price),
        stock: Number(stock) || 0,
        size: size || undefined,
        category,
        description,
        media,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text variant="label">Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
        {media.map((uri, i) => (
          <View key={i} style={styles.mediaItem}>
            <Image source={{ uri }} style={styles.mediaImg} contentFit="cover" />
            <Pressable style={styles.removeMedia} onPress={() => setMedia((m) => m.filter((_, idx) => idx !== i))} hitSlop={6}>
              <X size={14} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {media.length < 5 ? (
          <Pressable style={styles.addMedia} onPress={pickImage}>
            <ImagePlus size={26} color={colors.primary} />
            <Text variant="small" color={colors.primary}>Add</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Input label="Product name" placeholder="e.g. Ankara Wrap Dress" value={name} onChangeText={setName} />
      <View style={styles.row}>
        <Input label="Price (₦)" placeholder="0" keyboardType="number-pad" value={price} onChangeText={setPrice} containerStyle={{ flex: 1 }} />
        <Input label="Stock" placeholder="0" keyboardType="number-pad" value={stock} onChangeText={setStock} containerStyle={{ flex: 1 }} />
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Category</Text>
        <Pressable style={styles.select} onPress={() => setCatPicker(true)}>
          <Text color={category ? colors.text : colors.mutedLight}>{category || 'Select category'}</Text>
          <ChevronDown size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Input label="Size / variant (optional)" placeholder="e.g. M, 43, 500ml" value={size} onChangeText={setSize} />
      <Input label="Description" placeholder="Describe your product…" value={description} onChangeText={setDescription} multiline style={styles.textarea} />

      <Button title={submitLabel} onPress={submit} loading={submitting} style={{ marginTop: spacing.sm }} />

      <Sheet visible={catPicker} onClose={() => setCatPicker(false)} title="Select category">
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {(categories ?? []).map((c) => (
            <Pressable key={c} style={styles.catRow} onPress={() => { setCategory(c); setCatPicker(false); }}>
              <Text>{c}</Text>
              {category === c ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  mediaRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  mediaItem: { position: 'relative' },
  mediaImg: { width: 90, height: 90, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  removeMedia: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  addMedia: { width: 90, height: 90, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', gap: spacing.md },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, minHeight: 50, backgroundColor: colors.surface },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
}));
