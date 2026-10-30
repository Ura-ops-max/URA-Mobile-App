// Welcome screen shown after the preloader to signed-out people: brand header,
// what URA does, and the ways in (create account, Google, sign in, or browse).
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, BadgeCheck, Camera, MessageCircle, ShieldCheck, Store, Truck, type LucideIcon } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { AuthDivider } from '@/components/AuthShell';
import { GoogleButton } from '@/components/GoogleButton';
import { GOOGLE_SIGN_IN_AVAILABLE } from '@/hooks/use-google-sign-in';
import { darkColors, fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';

const BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Buyer protection' },
  { icon: Truck, label: 'Fast delivery' },
  { icon: BadgeCheck, label: 'Verified shops' },
];

const FEATURES: { icon: LucideIcon; tone: 'primary' | 'success' | 'info' | 'warning'; title: string; text: string }[] = [
  { icon: Store, tone: 'primary', title: 'Sell in minutes', text: 'Open a shop, list products and reach buyers across Nigeria.' },
  { icon: ShieldCheck, tone: 'success', title: 'Pay safely', text: 'With Buyer-Protected Payment, the shop is paid only when you confirm.' },
  { icon: MessageCircle, tone: 'info', title: 'Chat with shops', text: 'Ask questions, follow businesses and see what they post.' },
  { icon: Camera, tone: 'warning', title: 'Search with a photo', text: 'Snap a picture and find products that match.' },
];

const LINKS: { label: string; href: Href }[] = [
  { label: 'About', href: '/(public)/about' },
  { label: 'FAQ', href: '/(public)/faq' },
  { label: 'Contact', href: '/(public)/contact' },
  { label: 'Terms', href: '/(public)/terms' },
  { label: 'Privacy', href: '/(public)/privacy' },
];

export default function LandingScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tint = (t: (typeof FEATURES)[number]['tone']) =>
    ({
      primary: [colors.primarySoft, colors.primary],
      success: [colors.successSoft, colors.success],
      info: [colors.infoSoft, colors.info],
      warning: [colors.warningSoft, colors.warning],
    })[t];

  return (
    <View style={styles.root}>
      {/* Light status-bar text over the dark header, in both themes. */}
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }} bounces={false}>
        {/* Brand header — always dark, so the white wordmark reads in both themes */}
        <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
          <View pointerEvents="none" style={styles.glowA} />
          <View pointerEvents="none" style={styles.glowB} />
          <View style={styles.topBar}>
            <Image source={require('@/assets/images/ura-wordmark.png')} style={styles.wordmark} contentFit="contain" />
            <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={10} style={styles.signInPill}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>

          <Animated.View entering={FadeInDown.duration(500)}>
            <Text style={styles.kicker}>NIGERIA&apos;S SOCIAL MARKETPLACE</Text>
            <Text style={styles.title}>
              Buy and sell with people you <Text style={[styles.title, { color: darkColors.primary }]}>trust</Text>.
            </Text>
            <Text style={styles.subtitle}>
              Discover local businesses, chat with sellers and pay safely, all in one app.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.badges}>
            {BADGES.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.badge}>
                <Icon size={13} color={darkColors.primary} />
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* What you can do */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => {
            const [bg, fg] = tint(f.tone);
            return (
              <Animated.View key={f.title} entering={FadeInDown.delay(250 + i * 80).duration(450)} style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: bg }]}>
                  <f.icon size={20} color={fg} />
                </View>
                <Text variant="bodyMedium">{f.title}</Text>
                <Text variant="small" muted style={{ lineHeight: 17 }}>
                  {f.text}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Ways in */}
        <Animated.View entering={FadeInDown.delay(550).duration(450)} style={styles.actions}>
          <Button
            title="Create a free account"
            size="lg"
            style={styles.primary}
            rightIcon={<ArrowRight size={18} color={colors.white} />}
            onPress={() => router.push('/(auth)/register')}
          />
          {GOOGLE_SIGN_IN_AVAILABLE ? <GoogleButton /> : null}
          <AuthDivider label="already on URA?" />
          <Button title="Sign in" variant="outline" size="lg" style={styles.secondary} onPress={() => router.push('/(auth)/login')} />
          <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={8} style={styles.browse}>
            <Text variant="label" muted>
              Just looking?{' '}
              <Text variant="label" weight="semibold" color={colors.primary}>
                Browse the marketplace
              </Text>
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.links}>
          {LINKS.map((l) => (
            <Text key={l.label} variant="small" muted onPress={() => router.push(l.href)}>
              {l.label}
            </Text>
          ))}
        </View>
        <Text variant="small" muted center style={{ marginBottom: insets.bottom }}>
          By continuing you agree to URA&apos;s Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: darkColors.background,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.lg,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    gap: spacing.lg,
  },
  glowA: { position: 'absolute', top: -80, right: -120, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,107,53,0.22)' },
  glowB: { position: 'absolute', bottom: -140, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,107,53,0.12)' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { width: 104, height: 28 },
  signInPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  signInText: { fontFamily: fontFamily.semibold, fontSize: 13, color: darkColors.text },
  kicker: { fontFamily: fontFamily.bold, fontSize: 11, letterSpacing: 1.6, color: darkColors.primary, marginTop: spacing.lg },
  title: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: darkColors.text, marginTop: spacing.sm },
  subtitle: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22, color: darkColors.muted, marginTop: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: { fontFamily: fontFamily.semibold, fontSize: 12, color: darkColors.text },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xxxl,
  },
  feature: {
    width: '47.5%',
    flexGrow: 1,
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actions: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md },
  primary: { height: 56, borderRadius: 18 },
  secondary: { height: 54, borderRadius: 16 },
  browse: { alignItems: 'center', paddingVertical: spacing.xs },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
}));
