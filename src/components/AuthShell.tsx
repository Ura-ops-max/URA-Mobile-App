import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fontFamily, radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { Text } from '@/components/ui';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  /** Small line under the form, e.g. terms. */
  note?: ReactNode;
}

/** Shared frame for sign-in, sign-up and password screens: brand header, card, footer. */
export function AuthShell({ title, subtitle, children, footer, note, showBack = true }: AuthShellProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.root}>
      {/* Soft brand glow behind the header */}
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              {showBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={8}
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/(public)/landing'))}
                  style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
                >
                  <ChevronLeft size={22} color={colors.text} />
                </Pressable>
              ) : (
                <View style={{ width: 42 }} />
              )}
            </View>

            <View style={styles.brand}>
              <View style={styles.logoTile}>
                <Image source={require('@/assets/images/ura-mark.png')} style={styles.logoImg} contentFit="contain" />
              </View>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text variant="body" muted center style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>{children}</View>
            {note ? <View style={styles.note}>{note}</View> : null}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/** "──── or ────" */
export function AuthDivider({ label = 'or' }: { label?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text variant="small" muted>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  glowA: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primarySoft,
  },
  glowB: {
    position: 'absolute',
    top: -60,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.glow,
  },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', height: 52 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  brand: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  logoTile: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.floating,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
  },
  logoImg: { width: 42, height: 42 },
  title: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 32, color: colors.text, textAlign: 'center', letterSpacing: -0.4 },
  subtitle: { marginTop: spacing.sm, maxWidth: 320, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
    shadowOpacity: 0.05,
  },
  note: { marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
}));
