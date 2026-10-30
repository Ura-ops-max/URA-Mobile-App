// About URA (web pages/public/About): mission, story, pillars and values.
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Rocket, ShieldCheck, ShoppingBag, Sparkles, Target, TrendingUp, Users, type LucideIcon } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { darkColors, fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { InfoCard, InfoHero, Para } from '@/components/info/InfoKit';

const PILLARS: { icon: LucideIcon; tone: 'primary' | 'success' | 'info' | 'warning'; title: string; text: string }[] = [
  { icon: ShoppingBag, tone: 'primary', title: 'Social Commerce', text: 'Interact with sellers and buyers in real-time.' },
  { icon: Users, tone: 'success', title: 'Community First', text: 'Build a following for your brand across Nigeria.' },
  { icon: ShieldCheck, tone: 'info', title: 'Verified Trust', text: 'Safe transactions and verified local business logs.' },
  { icon: TrendingUp, tone: 'warning', title: 'Growth Tools', text: 'Scale from a local street shop to a national brand.' },
];

const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Trust & Safety',
    text: 'Every payment can use Buyer-Protected Payment and every vendor can be verified. Your money and your reputation are safe with us.',
  },
  {
    icon: Heart,
    title: 'Community First',
    text: 'Commerce is better together. We help vendors build a loyal following and buyers find people they can rely on.',
  },
  {
    icon: Rocket,
    title: 'Empowerment',
    text: 'We give every business, from a street shop to a national brand, the tools to reach customers, get paid, and grow.',
  },
];

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isAuthenticated, user } = useAuthContext();
  const tint = (t: (typeof PILLARS)[number]['tone']) =>
    ({
      primary: [colors.primarySoft, colors.primary],
      success: [colors.successSoft, colors.success],
      info: [colors.infoSoft, colors.info],
      warning: [colors.warningSoft, colors.warning],
    })[t];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <InfoHero
        icon={Sparkles}
        eyebrow="About URA"
        title="More than a marketplace. It's a community."
        intro="URA is Nigeria's hybrid social-commerce platform, bridging social interaction and local commerce so every Nigerian business can be seen, heard, and patronised."
      />

      <View style={styles.body}>
        {/* The wordmark's letters are white, so it sits on a dark panel in both themes. */}
        <View style={styles.brand}>
          <Image source={require('@/assets/images/ura-wordmark.png')} style={styles.wordmark} contentFit="contain" />
        </View>

        <View style={styles.pair}>
          <View style={[styles.highlight, { borderColor: colors.success }]}>
            <Target size={20} color={colors.success} />
            <Text variant="subheading">Our mission</Text>
            <Text variant="body" muted style={styles.italic}>
              “To empower the 40 million+ MSMEs in Nigeria by providing a digital ecosystem where social networking drives
              economic growth.”
            </Text>
          </View>
          <View style={[styles.highlight, { borderColor: colors.warning }]}>
            <Sparkles size={20} color={colors.warning} />
            <Text variant="subheading">Why URA?</Text>
            <Text variant="body" muted>
              In a market as vibrant as Nigeria, commerce is social. We don&apos;t just buy; we chat, we refer, and we build
              relationships. URA brings that &quot;market-day&quot; energy online.
            </Text>
          </View>
        </View>

        <InfoCard title="Born in Nigeria's markets, built for the internet age">
          <Para>
            URA started with a simple observation: in Nigeria, commerce has always been social. From bustling markets to
            WhatsApp groups and Instagram DMs, we buy and sell through conversation, referral, and trust. But moving that
            trust online has never been easy: buyers worry about scams, and honest sellers struggle to prove they&apos;re real.
          </Para>
          <Para>
            We built URA to fix that. By combining a social feed with a secure marketplace, we let vendors showcase their
            products, build a following, and get paid safely, while buyers discover local businesses and pay with confidence,
            knowing their money can be held safely until their order arrives.
          </Para>
          <Para>
            Today, URA is home to vendors and buyers across Nigeria, from fashion and gadgets to beauty and everyday
            essentials. And we&apos;re only just getting started.
          </Para>
        </InfoCard>

        <Text style={styles.sectionTitle}>Built for the Naija way</Text>
        <View style={styles.grid}>
          {PILLARS.map((p) => {
            const [bg, fg] = tint(p.tone);
            return (
              <View key={p.title} style={styles.pillar}>
                <View style={[styles.pillarIcon, { backgroundColor: bg }]}>
                  <p.icon size={20} color={fg} />
                </View>
                <Text variant="bodyMedium">{p.title}</Text>
                <Text variant="small" muted>
                  {p.text}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>What we stand for</Text>
        {VALUES.map((v) => (
          <InfoCard key={v.title} icon={v.icon} title={v.title}>
            <Para>{v.text}</Para>
          </InfoCard>
        ))}

        <View style={styles.cta}>
          <Text variant="heading" color={colors.white} center>
            Ready to grow with URA?
          </Text>
          <Text variant="body" color="#FFE9DE" center>
            Join the vendors and buyers already trading safely across Nigeria.
          </Text>
          {!isAuthenticated ? (
            <Button title="Create a free account" onPress={() => router.push('/(auth)/register')} style={styles.ctaBtn} />
          ) : !user?.isBusinessOwner ? (
            <Button title="Start selling" onPress={() => router.push('/become-seller')} style={styles.ctaBtn} />
          ) : (
            <Button title="Add a product" onPress={() => router.push('/create-product')} style={styles.ctaBtn} />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  body: { padding: spacing.lg, gap: spacing.md },
  brand: { height: 120, borderRadius: radii.xxl, backgroundColor: darkColors.surface, padding: spacing.xl, justifyContent: 'center' },
  wordmark: { width: '100%', height: '100%' },
  pair: { gap: spacing.md },
  highlight: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderTopColor: colors.border,
    borderRightColor: colors.border,
    borderBottomColor: colors.border,
  },
  italic: { fontStyle: 'italic', lineHeight: 22 },
  sectionTitle: { fontFamily: fontFamily.bold, fontSize: 20, color: colors.text, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  pillar: {
    width: '47.5%',
    flexGrow: 1,
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  pillarIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cta: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: spacing.xl, gap: spacing.sm, marginTop: spacing.md },
  // Dark button with white text on the orange card, in both themes.
  ctaBtn: { backgroundColor: darkColors.background, marginTop: spacing.sm },
}));
