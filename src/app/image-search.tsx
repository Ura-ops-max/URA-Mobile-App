import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { AlertCircle, Camera, ImageIcon, MapPin, Search as SearchIcon, Send, Sparkles, X } from 'lucide-react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Tabs, Text, Skeleton, useToast } from '@/components/ui';
import { AISearchResultCard } from '@/components/AISearchResultCard';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { assistantChat, imageSearch, textSearch, type GeoOptions } from '@/api/searchApi';
import { apiErrorMessage } from '@/api/orders';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useLocation } from '@/hooks/use-location';
import type { AISearchResult, AssistantMessage } from '@/types';

type Mode = 'text' | 'image' | 'ask';
const RADII = [5, 10, 25];

export default function ImageSearchRoute() {
  return <AiSearchView edges={['bottom']} />;
}

export function AiSearchView({ edges = ['bottom'], title }: { edges?: Edge[]; title?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [mode, setMode] = useState<Mode>('text');
  const [radius, setRadius] = useState(10);
  const geo = useLocation();

  const geoParams: GeoOptions | undefined =
    geo.enabled && geo.coords ? { lat: geo.coords.lat, lng: geo.coords.lng, radius_km: radius } : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {title ? (
        <View style={styles.titleRow}>
          <Text variant="title">{title}</Text>
        </View>
      ) : null}
      <View style={styles.modeToggle}>
        <Tabs
          variant="pill"
          value={mode}
          onChange={(k) => setMode(k as Mode)}
          items={[
            { key: 'text', label: 'Text' },
            { key: 'image', label: 'Image' },
            { key: 'ask', label: 'Ask AI' },
          ]}
        />
      </View>

      {mode !== 'ask' ? (
        <View style={styles.geoBar}>
          <Pressable style={styles.geoToggle} onPress={geo.toggle} disabled={geo.loading}>
            <MapPin size={16} color={geo.enabled ? colors.primary : colors.muted} />
            <Text variant="label" color={geo.enabled ? colors.primary : colors.muted}>
              {geo.loading ? 'Locating…' : geo.enabled ? 'Searching near you' : 'Search near me'}
            </Text>
          </Pressable>
          {geo.enabled ? (
            <View style={styles.radiusRow}>
              {RADII.map((r) => (
                <Pressable key={r} onPress={() => setRadius(r)} style={[styles.radiusChip, radius === r && styles.radiusChipActive]}>
                  <Text variant="small" color={radius === r ? colors.white : colors.muted}>{r}km</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {geo.denied ? (
        <Text variant="small" muted style={styles.deniedNote}>Location off — showing results without proximity ranking.</Text>
      ) : null}

      {mode === 'text' ? (
        <TextMode geoParams={geoParams} geoActive={!!geoParams} />
      ) : mode === 'image' ? (
        <ImageMode geoParams={geoParams} />
      ) : (
        <AskMode />
      )}
    </SafeAreaView>
  );
}

// ─── TEXT MODE ───────────────────────────────────────────────────────────────

function TextMode({ geoParams, geoActive }: { geoParams?: GeoOptions; geoActive: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clearing the box clears the results straight away (no effect needed).
  const onQueryChange = (v: string) => {
    setQuery(v);
    if (v.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await textSearch(query, geoParams);
        setResults(res);
        setHasSearched(true);
      } catch {
        setError('Search failed. Please try again.');
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, geoParams]);

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <SearchIcon size={18} color={colors.muted} />
        <TextInput
          placeholder="Search businesses, products, services…"
          placeholderTextColor={colors.mutedLight}
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
          autoFocus
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <X size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skelRow}>
              <Skeleton width={60} height={60} radius={12} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="90%" height={10} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <StateBox icon={<AlertCircle size={30} color={colors.danger} />} title={error} />
      ) : !hasSearched ? (
        <StateBox icon={<SearchIcon size={30} color={colors.mutedLight} />} title="Search across businesses & products" subtitle="Type at least 2 characters to begin" />
      ) : results.length === 0 ? (
        <StateBox icon={<AlertCircle size={30} color={colors.mutedLight} />} title="No results found" subtitle="Try a different query or expand your radius" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => `${r.type}-${r.id}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text variant="small" muted style={styles.resultsHead}>
              {results.length} results{geoActive ? ' near you' : ''}
            </Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <AISearchResultCard result={item} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

// ─── IMAGE MODE ──────────────────────────────────────────────────────────────

function ImageMode({ geoParams }: { geoParams?: GeoOptions }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { isAuthenticated, promptSignIn } = useRequireAuth();

  const run = async (uri: string) => {
    setImage(uri);
    setResults([]);
    setHasSearched(false);
    setLoading(true);
    try {
      const res = await imageSearch(uri, geoParams);
      setResults(res);
      setHasSearched(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Image search failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Your photo is uploaded before searching, and uploads need an account.
  const fromLibrary = async () => {
    if (!isAuthenticated) return promptSignIn();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Photo permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled) run(res.assets[0].uri);
  };
  const fromCamera = async () => {
    if (!isAuthenticated) return promptSignIn();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return toast.error('Camera permission needed');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) run(res.assets[0].uri);
  };
  const clear = () => {
    setImage(null);
    setResults([]);
    setHasSearched(false);
  };

  return (
    <FlatList
      style={styles.flex}
      data={results}
      keyExtractor={(r) => `${r.type}-${r.id}`}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.imageHeader}>
          {image ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image }} style={styles.preview} contentFit="cover" />
              <Pressable style={styles.clearImg} onPress={clear} hitSlop={6}>
                <X size={16} color={colors.white} />
              </Pressable>
              {loading ? (
                <View style={styles.analysing}>
                  <ActivityIndicator color={colors.white} />
                  <Text color={colors.white} weight="semibold">Analysing image…</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.dropzone}>
              <View style={styles.dropIcon}>
                <ImageIcon size={26} color={colors.primary} />
              </View>
              <Text variant="subheading" center>Visual product search</Text>
              <Text variant="caption" muted center>Snap or upload a photo to find similar products</Text>
            </View>
          )}
          <View style={styles.imgActions}>
            <Pressable style={styles.imgBtn} onPress={fromCamera}>
              <Camera size={18} color={colors.white} />
              <Text color={colors.white} weight="semibold">Take photo</Text>
            </Pressable>
            <Pressable style={[styles.imgBtn, styles.imgBtnOutline]} onPress={fromLibrary}>
              <ImageIcon size={18} color={colors.text} />
              <Text weight="semibold">Upload</Text>
            </Pressable>
          </View>
          {hasSearched && results.length > 0 ? (
            <Text variant="small" muted style={styles.resultsHead}>{results.length} visually similar products</Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <AISearchResultCard result={item} variant="grid" />
        </View>
      )}
      ListEmptyComponent={
        hasSearched && !loading ? (
          <StateBox icon={<AlertCircle size={30} color={colors.mutedLight} />} title="No similar products found" subtitle="Try another photo" />
        ) : undefined
      }
    />
  );
}

// ─── ASK AI MODE ─────────────────────────────────────────────────────────────

interface ThreadEntry extends AssistantMessage {
  suggestions?: AISearchResult[];
  /** A local error note — shown in the thread, never sent back to the assistant. */
  failed?: boolean;
}

function AskMode() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [messages, setMessages] = useState<ThreadEntry[]>([
    { role: 'assistant', content: 'Hi! I’m your URA shopping assistant. What are you looking for today?' },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const next: ThreadEntry[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setSending(true);
    try {
      const { reply, suggestions } = await assistantChat(
        next.filter((m) => !m.failed).map(({ role, content }) => ({ role, content })),
      );
      setMessages((m) => [...m, { role: 'assistant', content: reply, suggestions }]);
    } catch (err) {
      const msg = apiErrorMessage(err, "Couldn't reach the assistant.");
      setMessages((m) => [
        ...m,
        { role: 'assistant', failed: true, content: `${msg} You can still use Text or Image search above.` },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View>
            <View style={[styles.bubbleRow, item.role === 'user' ? styles.userRow : styles.aiRow]}>
              {item.role === 'assistant' ? (
                <View style={styles.aiAvatar}>
                  <Sparkles size={14} color={colors.white} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.aiBubble,
                  item.failed && { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Text color={item.role === 'user' ? colors.white : item.failed ? colors.danger : colors.text}>{item.content}</Text>
              </View>
            </View>
            {item.suggestions && item.suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {item.suggestions.map((s: AISearchResult) => (
                  <AISearchResultCard key={`${s.type}-${s.id}`} result={s} />
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={sending ? <View style={styles.typing}><ActivityIndicator color={colors.primary} size="small" /><Text muted variant="small">Assistant is typing…</Text></View> : undefined}
      />
      <View style={styles.composer}>
        <TextInput
          placeholder="Ask about products, prices, delivery…"
          placeholderTextColor={colors.mutedLight}
          value={draft}
          onChangeText={setDraft}
          style={styles.composerInput}
          multiline
        />
        <Pressable style={styles.send} onPress={send} hitSlop={6}>
          <Send size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function StateBox({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stateBox}>
      {icon}
      <Text variant="bodyMedium" center muted>{title}</Text>
      {subtitle ? <Text variant="small" muted center>{subtitle}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  titleRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  modeToggle: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  geoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  geoToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radiusRow: { flexDirection: 'row', gap: spacing.xs },
  radiusChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt },
  radiusChipActive: { backgroundColor: colors.primary },
  deniedNote: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, minHeight: 50 },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  resultsHead: { marginBottom: spacing.sm },
  skeletons: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  skelRow: { flexDirection: 'row', gap: spacing.md },
  gridRow: { gap: spacing.md, marginBottom: spacing.md },
  gridItem: { flex: 1, maxWidth: '48%' },
  imageHeader: { gap: spacing.md, marginBottom: spacing.md },
  previewWrap: { borderRadius: radii.lg, overflow: 'hidden' },
  preview: { width: '100%', height: 200, backgroundColor: colors.surfaceAlt },
  clearImg: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  analysing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  dropzone: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radii.lg, backgroundColor: colors.surface },
  dropIcon: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  imgActions: { flexDirection: 'row', gap: spacing.sm },
  imgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 48, borderRadius: radii.md, backgroundColor: colors.primary },
  imgBtnOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stateBox: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl * 1.5, paddingHorizontal: spacing.xl },
  thread: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  suggestions: { gap: spacing.sm, marginTop: spacing.sm, marginLeft: 36 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  composerInput: { flex: 1, maxHeight: 120, backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
}));
