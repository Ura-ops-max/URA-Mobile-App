import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, useToast } from '@/components/ui';
import { useTheme } from '@/theme';
import { resetPasswordMutationFn } from '@/api/auth';
import { apiErrorMessage } from '@/api/orders';

// Same password rule as the backend (validators/common.schemas.ts).
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]/;

/** Opened from a reset link (ura://reset-password?token=…). */
export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const mut = useMutation({
    mutationFn: () => resetPasswordMutationFn({ token: token ?? '', password }),
    onSuccess: () => {
      toast.success('Password changed. Sign in with your new password.');
      router.replace('/(auth)/login');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not reset your password. The link may have expired.')),
  });

  const weak = password.length > 0 && (password.length < 8 || !PASSWORD_RE.test(password));
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters with upper and lower case, a number and a symbol.">
      <Input
        variant="filled"
        placeholder="New password"
        password
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        leftIcon={<Lock size={18} color={colors.muted} />}
        error={weak ? 'Use upper and lower case, a number and a symbol (!@#$%^&*()_+)' : undefined}
      />
      <Input
        variant="filled"
        placeholder="Confirm new password"
        password
        autoComplete="new-password"
        value={confirm}
        onChangeText={setConfirm}
        leftIcon={<Lock size={18} color={colors.muted} />}
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      <Button
        title="Save new password"
        size="lg"
        style={styles.cta}
        onPress={() => mut.mutate()}
        loading={mut.isPending}
        disabled={!token || !password || weak || mismatch || password !== confirm}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  cta: { height: 54, borderRadius: 16 },
});
