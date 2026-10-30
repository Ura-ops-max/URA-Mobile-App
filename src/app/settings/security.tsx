import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, Switch, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, ShieldCheck } from 'lucide-react-native';
import { Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { toggleTwoFactor, updateEmail, updatePassword } from '@/api/settings';
import { useAuthContext } from '@/context/auth-provider';

export default function SecurityScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { user, refetchAuth } = useAuthContext();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailPassword, setEmailPassword] = useState('');
  const [twoFA, setTwoFA] = useState(!!user?.twoFactorEnabled);

  const passwordMut = useMutation({
    mutationFn: () => updatePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const emailMut = useMutation({
    mutationFn: () => updateEmail({ email, password: emailPassword }),
    onSuccess: () => { toast.success('Verification sent to new email'); refetchAuth(); setEmailPassword(''); },
  });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text variant="subheading">Change password</Text>
        <Input label="Current password" password value={current} onChangeText={setCurrent} />
        <Input label="New password" password value={next} onChangeText={setNext} hint="Min. 8 characters" />
        <Input label="Confirm new password" password value={confirm} onChangeText={setConfirm} error={confirm && next !== confirm ? 'Passwords do not match' : undefined} />
        <Button title="Update password" onPress={() => passwordMut.mutate()} loading={passwordMut.isPending} disabled={!current || next.length < 8 || next !== confirm} />
      </View>

      <View style={styles.card}>
        <Text variant="subheading">Email address</Text>
        <View style={styles.emailStatus}>
          <MailCheck size={16} color={user?.emailVerified ? colors.success : colors.warning} />
          <Text variant="small" muted>{user?.emailVerified ? 'Verified' : 'Not verified'}</Text>
          {!user?.emailVerified ? (
            <Text
              variant="small"
              color={colors.primary}
              onPress={() => router.push(`/(auth)/verify-email?email=${encodeURIComponent(user?.email ?? '')}`)}
            >
              Verify now
            </Text>
          ) : null}
        </View>
        <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Confirm with password" password value={emailPassword} onChangeText={setEmailPassword} />
        <Button title="Update email" variant="outline" onPress={() => emailMut.mutate()} loading={emailMut.isPending} disabled={!email.includes('@') || !emailPassword} />
      </View>

      <View style={styles.card}>
        <View style={styles.twoFARow}>
          <View style={styles.twoFALeft}>
            <View style={styles.twoFAIcon}>
              <ShieldCheck size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">Two-factor authentication</Text>
              <Text variant="small" muted>Add an extra layer of security to your account.</Text>
            </View>
          </View>
          <Switch
            value={twoFA}
            onValueChange={(v) => { setTwoFA(v); toggleTwoFactor(v); toast.show(v ? '2FA enabled' : '2FA disabled'); }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  emailStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  twoFARow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  twoFALeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  twoFAIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));
