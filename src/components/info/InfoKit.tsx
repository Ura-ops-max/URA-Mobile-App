// Building blocks for the information pages (About, FAQ, Contact, Terms,
// Privacy): a hero, section cards, and a "still need help?" card.
import { type ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Mail, MessageSquare, Phone, type LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/constants/config';

/** Page header: icon tile, small label, big title, intro and optional meta line. */
export function InfoHero({
  icon: Icon,
  eyebrow,
  title,
  intro,
  meta,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro?: string;
  meta?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.hero}>
      <View pointerEvents="none" style={styles.glow} />
      <View style={styles.heroIcon}>
        <Icon size={24} color={colors.primary} />
      </View>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      {intro ? (
        <Text variant="body" muted style={styles.intro}>
          {intro}
        </Text>
      ) : null}
      {meta ? (
        <View style={styles.meta}>
          <Text variant="small" muted>
            {meta}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** A rounded card with an optional numbered or icon badge. */
export function InfoCard({
  index,
  icon: Icon,
  iconColor,
  title,
  children,
}: {
  index?: number;
  icon?: LucideIcon;
  iconColor?: string;
  title?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.cardHead}>
          {index !== undefined ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index}</Text>
            </View>
          ) : Icon ? (
            <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
              <Icon size={16} color={iconColor ?? colors.primary} />
            </View>
          ) : null}
          <Text variant="subheading" style={{ flex: 1 }}>
            {title}
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Body text with comfortable line height. */
export function Para({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <Text variant="body" style={styles.para}>
      {children}
    </Text>
  );
}

/** "Still need help?" with email, call and the contact page. */
export function SupportCta({ title = 'Still need help?', text = 'Our team usually replies within a few hours.' }: { title?: string; text?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const actions: { icon: LucideIcon; label: string; onPress: () => void }[] = [
    { icon: Mail, label: 'Email us', onPress: () => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {}) },
    { icon: Phone, label: 'Call us', onPress: () => void Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {}) },
    { icon: MessageSquare, label: 'Contact page', onPress: () => router.push('/(public)/contact') },
  ];
  return (
    <View style={styles.cta}>
      <Text variant="subheading" color={colors.white}>
        {title}
      </Text>
      <Text variant="body" color="#FFE9DE">
        {text}
      </Text>
      <View style={styles.ctaRow}>
        {actions.map(({ icon: Icon, label, onPress }) => (
          <Pressable key={label} onPress={onPress} style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}>
            <Icon size={18} color={colors.primary} />
            <Text variant="small" weight="semibold" color={colors.primary}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** A tappable row with an icon, label, value and chevron. */
export function LinkRow({ icon: Icon, label, value, onPress }: { icon: LucideIcon; label: string; value?: string; onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}>
      <View style={styles.linkIcon}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="small" muted>
          {label}
        </Text>
        {value ? <Text variant="bodyMedium">{value}</Text> : null}
      </View>
      {onPress ? <ChevronRight size={18} color={colors.mutedLight} /> : null}
    </Pressable>
  );
}

export const useStyles = makeStyles((colors) => ({
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primarySoft,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: { fontFamily: fontFamily.bold, fontSize: 11, letterSpacing: 1.6, color: colors.primary },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.text,
    textAlign: 'center',
    marginTop: 6,
  },
  intro: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 22, maxWidth: 340 },
  meta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fontFamily.bold, fontSize: 13, color: colors.primary },
  para: { lineHeight: 23, color: colors.text },
  cta: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: spacing.xl, gap: spacing.sm },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ctaBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
