import { useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AuthShell } from '@/components/AuthShell';
import { Button, Text, useToast } from '@/components/ui';
import { fontFamily, radii, useTheme, makeStyles } from '@/theme';
import { resendVerificationMutationFn, verifyEmailMutationFn } from '@/api/auth';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();
  const { isAuthenticated, refetchAuth } = useAuthContext();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInputInstance | null)[]>([]);

  const code = digits.join('');

  const setDigit = (index: number, value: string) => {
    const typed = value.replace(/[^0-9]/g, '');
    // A pasted or auto-filled code ("482913") fills the boxes from here on.
    if (typed.length > 1) {
      const chars = typed.slice(0, 6 - index).split('');
      setDigits((d) => {
        const next = [...d];
        chars.forEach((c, k) => (next[index + k] = c));
        return next;
      });
      inputs.current[Math.min(index + chars.length, 5)]?.focus();
      return;
    }
    const v = typed.slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[index] = v;
      return next;
    });
    if (v && index < 5) inputs.current[index + 1]?.focus();
  };

  const onKey = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const verifyMut = useMutation({
    mutationFn: () => verifyEmailMutationFn({ email: email ?? '', token: code }),
    onSuccess: async () => {
      toast.success('Email verified!');
      // Signed in (opened from Password & Security): refresh and go back.
      if (isAuthenticated) {
        await refetchAuth();
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Invalid or expired code')),
  });

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email ?? 'your email'}.`}
    >
      <View style={styles.codeRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={d}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
            keyboardType="number-pad"
            // The first box accepts a pasted / auto-filled 6-digit code.
            maxLength={i === 0 ? 6 : 1}
            textContentType={i === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            style={[styles.box, d ? styles.boxFilled : null]}
          />
        ))}
      </View>
      <Button
        title="Verify email"
        size="lg"
        style={{ height: 54, borderRadius: 16 }}
        onPress={() => verifyMut.mutate()}
        loading={verifyMut.isPending}
        disabled={code.length !== 6}
      />
      <Pressable
        style={styles.resend}
        hitSlop={8}
        onPress={async () => {
          try {
            await resendVerificationMutationFn(email ?? '');
            toast.show('A new code has been sent');
          } catch {
            toast.error('Could not send a new code. Please try again.');
          }
        }}
      >
        <Text muted>
          Didn&apos;t get a code? <Text color={colors.primary} weight="semibold">Resend</Text>
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const useStyles = makeStyles((colors) => ({
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surfaceAlt,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.surface },
  resend: { alignItems: 'center', marginTop: 8 },
}));
