import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronDown, HelpCircle, Search } from 'lucide-react-native';
import { Input, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { InfoHero, SupportCta } from '@/components/info/InfoKit';

// Same questions and answers as the website's FAQ (www.ura.com.ng/faq).
const FAQS = [
  { q: 'What is URA?', a: 'URA is a marketplace where you can discover businesses, buy and sell products, and pay securely with buyer protection.' },
  { q: 'How do I create an account?', a: 'Tap "Get started", fill in your details, and verify your email. You can start browsing right away and set up a payment profile when you\'re ready to buy or sell.' },
  { q: 'How does payment work?', a: 'Payments are processed securely through our partner Payluk. You can pay instantly, or use Buyer-Protected Payment so your funds are only released to the seller once your order is confirmed.' },
  { q: 'What is Buyer-Protected Payment and why should I use it?', a: 'Buyer-Protected Payment holds your payment safely until you confirm you\'ve received your order as described. It protects both buyers and sellers from fraud.' },
  { q: 'How do I become a seller?', a: 'Go to More and choose "Switch to business account". You can then list products and receive payments directly to your wallet.' },
  { q: 'Do I need to fund my wallet?', a: 'No. At checkout you can pay by card. If you already have a wallet balance (for example from sales or a refund), you can pay from it or withdraw it.' },
  { q: 'Is my personal information safe?', a: 'Yes. We use encryption and never sell your data. See our Privacy Policy for full details on how we handle your information.' },
  { q: 'How do I contact support?', a: 'You can reach our team any time via the Contact page or by emailing info@ura.com.ng.' },
];

export default function FAQScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = FAQS.map((f, i) => ({ ...f, i })).filter((f) => !q || `${f.q} ${f.a}`.toLowerCase().includes(q));

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <InfoHero icon={HelpCircle} eyebrow="Help centre" title="How can we help?" intro="Answers to the questions we hear most often." />
      <View style={styles.body}>
        <Input
          placeholder="Search questions"
          value={query}
          onChangeText={setQuery}
          leftIcon={<Search size={18} color={colors.muted} />}
          variant="filled"
        />
        {shown.length === 0 ? (
          <Text muted center style={{ marginVertical: spacing.xl }}>
            No questions match “{query}”.
          </Text>
        ) : null}
        {shown.map(({ q: question, a, i }) => {
          const isOpen = open === i || !!q;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={[styles.item, isOpen && styles.itemOpen]}
              onPress={() => setOpen(open === i ? null : i)}
            >
              <View style={styles.qRow}>
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {question}
                </Text>
                <View style={[styles.chev, isOpen && styles.chevOpen]}>
                  <ChevronDown
                    size={18}
                    color={isOpen ? colors.white : colors.muted}
                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                  />
                </View>
              </View>
              {isOpen ? (
                <Animated.View entering={FadeIn.duration(180)}>
                  <Text variant="body" muted style={styles.answer}>
                    {a}
                  </Text>
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
        <SupportCta title="Can't find your answer?" />
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  body: { padding: spacing.lg, gap: spacing.md },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  itemOpen: { borderColor: colors.primary },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chev: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  chevOpen: { backgroundColor: colors.primary },
  answer: { marginTop: spacing.md, lineHeight: 22 },
}));
