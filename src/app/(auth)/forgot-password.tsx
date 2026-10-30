import { useState } from 'react';
import { View } from 'react-native';
import { Mail, MailCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { forgotPasswordMutationFn } from '@/api/auth';
import { apiErrorMessage } from '@/api/orders';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The backend emails a reset link to the website
 * (www.ura.com.ng/auth/reset-password?token=…), so the new password is set there.
 */
export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mut = useMutation({
    mutationFn: () => forgotPasswordMutationFn(email.trim().toLowerCase()),
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not send the reset link. Please try again.')),
  });

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`If an account uses ${email.trim()}, we've sent it a password reset link.`}>
        <View style={styles.sentIcon}>
          <MailCheck size={30} color={colors.success} />
        </View>
        <Text variant="body" muted center>
          Open the link in the email to choose a new password. It opens the URA website. Then come back here and sign in.
        </Text>
        <Button title="Back to sign in" size="lg" style={styles.cta} onPress={() => router.replace('/(auth)/login')} />
        <Button title="Send the link again" variant="ghost" loading={mut.isPending} onPress={() => mut.mutate()} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter the email on your account and we'll send you a link to reset your password.">
      <Input
        variant="filled"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        leftIcon={<Mail size={18} color={colors.muted} />}
        returnKeyType="send"
        onSubmitEditing={() => EMAIL_RE.test(email.trim()) && mut.mutate()}
      />
      <Button
        title="Send reset link"
        size="lg"
        style={styles.cta}
        onPress={() => mut.mutate()}
        loading={mut.isPending}
        disabled={!EMAIL_RE.test(email.trim())}
      />
    </AuthShell>
  );
}

const useStyles = makeStyles((colors) => ({
  cta: { height: 54, borderRadius: 16 },
  sentIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
}));
