import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Bookmark,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Info,
  LogOut,
  Lock,
  Package,
  Receipt,
  ShieldCheck,
  Store,
  Tag,
  User,
  Wallet,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  Mail,
  PlusSquare,
  Trash2,
  Check,
  Moon,
  Smartphone,
  Sun,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { Avatar, Button, Sheet, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles, type ThemePreference } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { useConfirmLogout } from '@/hooks/use-confirm-logout';

interface Row {
  icon: typeof User;
  label: string;
  onPress: () => void;
  danger?: boolean;
  /** Current value shown on the right, e.g. "System". */
  value?: string;
}

const APPEARANCE: { key: ThemePreference; label: string; hint: string; icon: typeof User }[] = [
  { key: 'system', label: 'System', hint: "Match your phone's setting", icon: Smartphone },
  { key: 'light', label: 'Light', hint: 'Always light', icon: Sun },
  { key: 'dark', label: 'Dark', hint: 'Always dark', icon: Moon },
];

export default function MoreScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user, isAuthenticated } = useAuthContext();
  const confirmLogout = useConfirmLogout();
  const isSeller = !!user?.isBusinessOwner;
  const { preference, setPreference } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const display: { title: string; rows: Row[] } = {
    title: 'Display',
    rows: [
      {
        icon: preference === 'dark' ? Moon : preference === 'light' ? Sun : Smartphone,
        label: 'Appearance',
        value: APPEARANCE.find((a) => a.key === preference)?.label,
        onPress: () => setAppearanceOpen(true),
      },
    ],
  };

  const support: Row[] = [
    { icon: Info, label: 'About URA', onPress: () => router.push('/(public)/about' as Href) },
    { icon: HelpCircle, label: 'Help & FAQ', onPress: () => router.push('/(public)/faq' as Href) },
    { icon: Mail, label: 'Contact support', onPress: () => router.push('/(public)/contact' as Href) },
    { icon: FileText, label: 'Terms of service', onPress: () => router.push('/(public)/terms' as Href) },
    { icon: ShieldCheck, label: 'Privacy policy', onPress: () => router.push('/(public)/privacy' as Href) },
  ];

  const sections: { title: string; rows: Row[] }[] = isAuthenticated
    ? [
        {
          title: 'Account',
          rows: [
            { icon: User, label: 'Edit profile', onPress: () => router.push('/settings/profile') },
            { icon: Lock, label: 'Password & security', onPress: () => router.push('/settings/security') },
            { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications') },
            ...(!isSeller
              ? [{ icon: Store, label: 'Switch to business account', onPress: () => router.push('/become-seller') }]
              : []),
          ],
        },
        {
          title: 'Activity & Finances',
          rows: [
            { icon: Activity, label: 'Recent activity', onPress: () => router.push('/settings/activities') },
            { icon: Receipt, label: 'Transaction history', onPress: () => router.push('/wallet/transactions') },
            { icon: Wallet, label: 'Wallet', onPress: () => router.push('/wallet') },
            { icon: CreditCard, label: 'Payment setup', onPress: () => router.push('/payluk-setup') },
          ],
        },
        {
          title: 'Shopping',
          rows: [
            { icon: Package, label: 'My orders', onPress: () => router.push('/orders') },
            { icon: Bookmark, label: 'Bookmarks', onPress: () => router.push('/bookmarks') },
            { icon: Tag, label: 'Deals & offers', onPress: () => router.push('/deals') },
          ],
        },
        ...(isSeller
          ? [
              {
                title: 'My Shop',
                rows: [
                  { icon: ClipboardList, label: 'Shop orders', onPress: () => router.push('/shop-orders') },
                  { icon: Boxes, label: 'Inventory', onPress: () => router.push('/inventory') },
                  { icon: PlusSquare, label: 'Add a product', onPress: () => router.push('/create-product') },
                  ...(user?.business?._id
                    ? [{ icon: Store, label: 'View my shop', onPress: () => router.push(`/business/${user.business!._id}`) }]
                    : []),
                ],
              },
            ]
          : []),
        display,
        { title: 'Support', rows: support },
      ]
    : [display, { title: 'Support', rows: support }];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isAuthenticated ? (
          <View style={[styles.profileCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
            <Text variant="subheading">Welcome to URA</Text>
            <Text variant="caption" muted>
              Sign in to buy, sell, chat with shops and track your orders.
            </Text>
            <Button title="Sign in" onPress={() => router.push('/(auth)/login')} />
            <Button title="Create account" variant="outline" onPress={() => router.push('/(auth)/register')} />
          </View>
        ) : null}
        {isAuthenticated ? (
        <Pressable style={styles.profileCard} onPress={() => user && router.push(`/user/${user._id}`)}>
          <Avatar uri={user?.profilePicture} name={`${user?.firstName} ${user?.lastName}`} size={52} verified={user?.isBusinessOwner} />
          <View style={{ flex: 1 }}>
            <Text variant="subheading" numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
            <Text variant="caption" muted numberOfLines={1}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color={colors.mutedLight} />
        </Pressable>
        ) : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="small" muted style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <View key={row.label}>
                  <SettingRow row={row} />
                  {i < section.rows.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        {isAuthenticated ? (
          <View style={styles.card}>
            <SettingRow row={{ icon: LogOut, label: 'Log out', danger: true, onPress: confirmLogout }} />
            <View style={styles.divider} />
            <SettingRow row={{ icon: Trash2, label: 'Delete account', danger: true, onPress: () => router.push('/settings/delete-account') }} />
          </View>
        ) : null}
        <Text variant="small" muted center>
          URA {Constants.expoConfig?.version ?? ''}
        </Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <Sheet visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} title="Appearance">
        <View style={{ gap: spacing.sm }}>
          {APPEARANCE.map((a) => {
            const active = a.key === preference;
            return (
              <Pressable
                key={a.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setPreference(a.key);
                  setAppearanceOpen(false);
                }}
                style={[styles.choice, active && styles.choiceActive]}
              >
                <View style={[styles.rowIcon, active && { backgroundColor: colors.primary }]}>
                  <a.icon size={17} color={active ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{a.label}</Text>
                  <Text variant="small" muted>
                    {a.hint}
                  </Text>
                </View>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function SettingRow({ row }: { row: Row }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable style={styles.rowInner} onPress={row.onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, row.danger && { backgroundColor: colors.dangerSoft }]}>
          <row.icon size={17} color={row.danger ? colors.danger : colors.primary} />
        </View>
        <Text variant="body" color={row.danger ? colors.danger : colors.text}>{row.label}</Text>
      </View>
      <View style={styles.rowLeft}>
        {row.value ? <Text variant="small" muted>{row.value}</Text> : null}
        {!row.danger ? <ChevronRight size={17} color={colors.mutedLight} /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  choiceActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs, letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md - 1, minHeight: 48 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: { width: 34, height: 34, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 58 },
}));
