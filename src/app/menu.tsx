import { Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import {
  Bell,
  Bookmark,
  Camera,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Info,
  MessageCircle,
  Package,
  PlusSquare,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Wallet,
} from 'lucide-react-native';
import { Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';

interface Item {
  icon: typeof Store;
  label: string;
  href: Href;
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'General',
    items: [
      { icon: MessageCircle, label: 'Chat', href: '/(tabs)/chat' },
      { icon: Bell, label: 'Notifications', href: '/notifications' },
      { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
      { icon: Wallet, label: 'Wallet & Payments', href: '/wallet' },
    ],
  },
  {
    title: 'Shopping & Savings',
    items: [
      { icon: ShoppingBag, label: 'My Cart', href: '/cart' },
      { icon: Package, label: 'My Orders', href: '/orders' },
      { icon: Tag, label: 'Deals & Offers', href: '/deals' },
      { icon: Camera, label: 'Visual Search', href: '/image-search' },
    ],
  },
  {
    title: 'Business Tools',
    items: [
      { icon: PlusSquare, label: 'List a Product', href: '/create-product' },
      { icon: Store, label: 'Marketplace', href: '/(public)/products' },
      { icon: CreditCard, label: 'Payment Setup', href: '/payluk-setup' },
      { icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: Info, label: 'About URA', href: '/(public)/about' },
      { icon: HelpCircle, label: 'Help & FAQ', href: '/(public)/faq' },
    ],
  },
];

export default function MenuScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="label" muted style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
          <View style={styles.card}>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <Pressable style={styles.row} onPress={() => router.push(item.href)}>
                  <View style={styles.rowLeft}>
                    <View style={styles.icon}>
                      <item.icon size={18} color={colors.primary} />
                    </View>
                    <Text variant="body">{item.label}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.mutedLight} />
                </Pressable>
                {i < section.items.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs, letterSpacing: 1 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 60 },
}));
