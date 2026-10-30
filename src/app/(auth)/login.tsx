import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Lock, User } from 'lucide-react-native';
import { AuthDivider, AuthShell } from '@/components/AuthShell';
import { GoogleButton } from '@/components/GoogleButton';
import { Button, Input, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { GOOGLE_SIGN_IN_AVAILABLE } from '@/hooks/use-google-sign-in';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, isLoggingIn } = useAuthContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Enter your email or username and your password.');
      return;
    }
    try {
      await login({ email: identifier.trim(), password });
      router.replace('/(tabs)/home');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(
        err.response?.data?.message ??
          (err.message === 'Network Error' ? 'Cannot reach URA. Check your internet connection.' : 'Invalid email/username or password'),
      );
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to shop, sell and chat on URA."
      footer={
        <View style={styles.row}>
          <Text muted>New to URA?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
            <Text color={colors.primary} weight="semibold">
              {' '}
              Create an account
            </Text>
          </Pressable>
        </View>
      }
      note={
        <Pressable onPress={() => router.replace('/(tabs)/home')} hitSlop={8} style={{ alignItems: 'center' }}>
          <Text variant="label" muted>
            Just looking? <Text variant="label" color={colors.text} weight="semibold">Browse without an account</Text>
          </Text>
        </Pressable>
      }
    >
      <Input
        variant="filled"
        placeholder="Email or username"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        value={identifier}
        onChangeText={setIdentifier}
        leftIcon={<User size={18} color={colors.muted} />}
        returnKeyType="next"
      />
      <Input
        variant="filled"
        placeholder="Password"
        password
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        leftIcon={<Lock size={18} color={colors.muted} />}
        error={error ?? undefined}
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
      <Pressable style={styles.forgot} onPress={() => router.push('/(auth)/forgot-password')} hitSlop={8}>
        <Text color={colors.primary} weight="semibold" variant="label">
          Forgot password?
        </Text>
      </Pressable>
      <Button title="Sign in" size="lg" onPress={() => void onSubmit()} loading={isLoggingIn} style={styles.cta} />

      {GOOGLE_SIGN_IN_AVAILABLE ? (
        <>
          <AuthDivider label="or continue with" />
          <GoogleButton />
        </>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  cta: { height: 54, borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
