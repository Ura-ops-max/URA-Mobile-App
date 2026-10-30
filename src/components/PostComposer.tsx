import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Package, Play, Upload, X } from 'lucide-react-native';
import { Button, Tabs, Text, useToast } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { createPost } from '@/api/posts';
import { getMyProducts } from '@/api/posts';
import { formatNaira } from '@/lib/format';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

export function PostComposer() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<'normal' | 'product'>('normal');
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: myProducts } = useQuery({ queryKey: ['my-products'], queryFn: getMyProducts, enabled: type === 'product' });

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Media permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });
    if (!res.canceled) {
      const items: MediaItem[] = res.assets.map((a) => ({ uri: a.uri, type: a.type === 'video' ? 'video' : 'image' }));
      setMedia((m) => [...m, ...items].slice(0, 5));
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const submit = async () => {
    if (!caption.trim()) return toast.error('Caption is required');
    if (type === 'product' && !productId) return toast.error('Please select a product to attach');
    setSubmitting(true);
    try {
      await createPost({
        caption: caption.trim(),
        tags,
        media: media.map((m) => m.uri),
        mediaTypes: media.map((m) => m.type),
        productId: type === 'product' ? productId ?? undefined : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Posted to your feed!');
      router.replace('/(tabs)/home');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text variant="heading">What&apos;s on your mind?</Text>
        <Text variant="caption" muted>Share an update, photo, or thought with your community</Text>

        <View style={styles.typeToggle}>
          <TypeChip active={type === 'normal'} icon={<Megaphone size={16} color={type === 'normal' ? colors.primary : colors.muted} />} label="General Post" onPress={() => setType('normal')} />
          <TypeChip active={type === 'product'} icon={<Package size={16} color={type === 'product' ? colors.primary : colors.muted} />} label="Product Post" onPress={() => setType('product')} />
        </View>

        <Text variant="label" style={styles.sectionLabel}>Media Upload</Text>
        {media.length === 0 ? (
          <Pressable style={styles.dropzone} onPress={pickMedia}>
            <View style={styles.dropIcon}><Upload size={22} color={colors.primary} /></View>
            <Text variant="label" color={colors.primary}>PHOTOS / VIDEO</Text>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
            {media.map((m, i) => (
              <View key={i} style={styles.mediaItem}>
                <Image source={{ uri: m.uri }} style={styles.mediaImg} contentFit="cover" />
                {m.type === 'video' ? (
                  <View style={styles.videoBadge}><Play size={12} color={colors.white} fill={colors.white} /></View>
                ) : null}
                <Pressable style={styles.removeMedia} onPress={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={6}>
                  <X size={13} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {media.length < 5 ? (
              <Pressable style={styles.addMore} onPress={pickMedia}>
                <Upload size={20} color={colors.primary} />
              </Pressable>
            ) : null}
          </ScrollView>
        )}

        <Text variant="label" style={styles.sectionLabel}>Caption (Required)</Text>
        <TextInput
          placeholder="What's happening?"
          placeholderTextColor={colors.mutedLight}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxFontSizeMultiplier={1.2}
          style={styles.textarea}
        />

        <Text variant="label" style={styles.sectionLabel}>Tags</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            placeholder="Add a tag and press +"
            placeholderTextColor={colors.mutedLight}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            returnKeyType="done"
            maxFontSizeMultiplier={1.2}
            style={styles.tagInput}
          />
          <Pressable style={styles.tagAdd} onPress={addTag}><Text color={colors.white} weight="bold">+</Text></Pressable>
        </View>
        {tags.length > 0 ? (
          <View style={styles.tagWrap}>
            {tags.map((t) => (
              <Pressable key={t} style={styles.tag} onPress={() => setTags((prev) => prev.filter((x) => x !== t))}>
                <Text variant="small" color={colors.primary}>#{t}</Text>
                <X size={12} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {type === 'product' ? (
          <>
            <Text variant="label" style={styles.sectionLabel}>Attach a product</Text>
            {(myProducts ?? []).length === 0 ? (
              <Text variant="caption" muted>You have no products yet. List one first.</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {(myProducts ?? []).map((p) => {
                  const pid = p.product?._id ?? p._id;
                  const active = productId === pid;
                  return (
                    <Pressable key={p._id} style={[styles.productRow, active && styles.productRowActive]} onPress={() => setProductId(pid)}>
                      <Image source={{ uri: p.media[0] }} style={styles.productThumb} contentFit="cover" />
                      <View style={{ flex: 1 }}>
                        <Text variant="label" numberOfLines={1}>{p.name ?? p.productName}</Text>
                        <Text variant="caption" color={colors.primary}>{formatNaira(p.price ?? 0)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        ) : null}

        <Button title="Publish post" onPress={submit} loading={submitting} style={{ marginTop: spacing.md }} />
      </View>
    </ScrollView>
  );
}

function TypeChip({ active, icon, label, onPress }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable style={[styles.typeChip, active && styles.typeChipActive]} onPress={onPress}>
      {icon}
      <Text variant="label" color={active ? colors.primary : colors.muted}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  typeToggle: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: 4, marginTop: spacing.sm },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: radii.sm },
  typeChipActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { marginTop: spacing.md },
  dropzone: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  dropIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mediaRow: { gap: spacing.sm },
  mediaItem: { position: 'relative' },
  mediaImg: { width: 88, height: 88, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  videoBadge: { position: 'absolute', bottom: 4, left: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeMedia: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  addMore: { width: 88, height: 88, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  textarea: { minHeight: 90, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, textAlignVertical: 'top', backgroundColor: colors.surface },
  tagInputRow: { flexDirection: 'row', gap: spacing.sm },
  tagInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, minHeight: 44, fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, backgroundColor: colors.surface },
  tagAdd: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md },
  productRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  productThumb: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.surfaceAlt },
}));
