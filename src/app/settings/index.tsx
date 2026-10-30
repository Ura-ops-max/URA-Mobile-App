import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  Activity,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Lock,
  LogOut,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react-native';
import { Avatar, Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { useConfirmLogout } from '@/hooks/use-confirm-logout';

interface Row {
  icon: typeof User;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export default function SettingsHome() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuthContext();
  const confirmLogout = useConfirmLogout();

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Account',
      rows: [
        { icon: User, label: 'Edit profile', onPress: () => router.push('/settings/profile') },
        { icon: Lock, label: 'Password & security', onPress: () => router.push('/settings/security') },
        { icon: Activity, label: 'Activity log', onPress: () => router.push('/settings/activities') },
      ],
    },
    {
      title: 'Payments',
      rows: [
        { icon: Wallet, label: 'Wallet', onPress: () => router.push('/wallet') },
        { icon: CreditCard, label: 'Payment setup (Payluk)', onPress: () => router.push('/payluk-setup') },
      ],
    },
    {
      title: 'Support',
      rows: [
        { icon: HelpCircle, label: 'Help & FAQ', onPress: () => router.push('/(public)/faq') },
        { icon: ShieldCheck, label: 'Privacy policy', onPress: () => router.push('/(public)/privacy') },
      ],
    },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <Avatar uri={user?.profilePicture} name={`${user?.firstName} ${user?.lastName}`} size={60} verified={user?.isBusinessOwner} />
        <View style={{ flex: 1 }}>
          <Text variant="subheading">{user?.firstName} {user?.lastName}</Text>
          <Text variant="small" muted>{user?.email}</Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="label" muted style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
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

      <View style={styles.card}>
        <SettingRow row={{ icon: LogOut, label: 'Log out', danger: true, onPress: confirmLogout }} />
      </View>
    </ScrollView>
  );
}

function SettingRow({ row }: { row: Row }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable style={styles.rowInner} onPress={row.onPress}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, row.danger && { backgroundColor: colors.dangerSoft }]}>
          <row.icon size={18} color={row.danger ? colors.danger : colors.primary} />
        </View>
        <Text variant="body" color={row.danger ? colors.danger : colors.text}>{row.label}</Text>
      </View>
      {!row.danger ? <ChevronRight size={18} color={colors.mutedLight} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 60 },
}));
