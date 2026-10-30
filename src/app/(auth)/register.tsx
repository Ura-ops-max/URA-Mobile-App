import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Square, SquareCheck, X } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounced } from '@/hooks/use-debounced';
import { AuthDivider, AuthShell } from '@/components/AuthShell';
import { GoogleButton } from '@/components/GoogleButton';
import { GOOGLE_SIGN_IN_AVAILABLE } from '@/hooks/use-google-sign-in';
import { Button, Input, Text, useToast } from '@/components/ui';
import { spacing, useTheme } from '@/theme';
import { checkUsernameAvailability, registerMutationFn } from '@/api/auth';
import { apiErrorMessage } from '@/api/orders';

// Same rules as the backend (validators/common.schemas.ts, constants/validation.constants.ts).
const NAME_RE = /^[a-zA-Z\s'-]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PHONE_RE = /^0[789][01]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]/;

type Form = { firstName: string; lastName: string; username: string; email: string; phone: string; password: string };

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  const name = (v: string, label: string) => {
    const t = v.trim();
    if (!t) return `${label} is required`;
    if (t.length < 2) return `${label} must be at least 2 characters`;
    if (t.length > 100) return `${label} cannot exceed 100 characters`;
    if (!NAME_RE.test(t)) return `${label} can only contain letters, spaces, hyphens and apostrophes`;
    return undefined;
  };
  e.firstName = name(f.firstName, 'First name');
  e.lastName = name(f.lastName, 'Last name');
  const u = f.username.trim();
  e.username = !u
    ? 'Username is required'
    : u.length < 3
      ? 'Username must be at least 3 characters'
      : u.length > 30
        ? 'Username cannot exceed 30 characters'
        : !USERNAME_RE.test(u)
          ? 'Use only letters, numbers and underscores'
          : undefined;
  e.email = EMAIL_RE.test(f.email.trim()) ? undefined : 'Please provide a valid email address';
  e.phone = PHONE_RE.test(f.phone.trim())
    ? undefined
    : 'Phone number must be a valid Nigerian number starting with 070, 080, 081, 090 or 091 (11 digits)';
  e.password =
    f.password.length < 8
      ? 'Password must be at least 8 characters long'
      : f.password.length > 128
        ? 'Password cannot exceed 128 characters'
        : !PASSWORD_RE.test(f.password)
          ? 'Use an uppercase letter, a lowercase letter, a number and a special character (!@#$%^&*()_+)'
          : undefined;
  return e;
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [form, setForm] = useState<Form>({ firstName: '', lastName: '', username: '', email: '', phone: '', password: '' });
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [agreed, setAgreed] = useState(false);

  const set = (key: keyof Form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const blur = (key: keyof Form) => () => setTouched((t) => ({ ...t, [key]: true }));
  const errors = validate(form);
  const show = (key: keyof Form) => (touched[key] ? errors[key] : undefined);

  // Check the username once typing pauses.
  const typedUsername = form.username.trim();
  const usernameToCheck = useDebounced(typedUsername, 500);
  const canCheck = usernameToCheck.length >= 3 && usernameToCheck.length <= 30 && USERNAME_RE.test(usernameToCheck);
  const usernameQuery = useQuery({
    queryKey: ['username-available', usernameToCheck],
    queryFn: () => checkUsernameAvailability(usernameToCheck),
    enabled: canCheck,
    staleTime: 60_000,
    retry: false,
  });
  const usernameState: 'idle' | 'checking' | 'available' | 'taken' = !canCheck || usernameToCheck !== typedUsername
    ? typedUsername.length >= 3 && USERNAME_RE.test(typedUsername)
      ? 'checking'
      : 'idle'
    : usernameQuery.isFetching
      ? 'checking'
      : usernameQuery.data
        ? usernameQuery.data.available
          ? 'available'
          : 'taken'
        : 'idle';

  const registerMut = useMutation({
    mutationFn: () =>
      registerMutationFn({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      }),
    onSuccess: () => {
      toast.success('Account created! Verify your email.');
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(form.email.trim())}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create account')),
  });

  const valid = Object.values(errors).every((v) => !v);
  const canSubmit = valid && agreed && usernameState !== 'taken' && usernameState !== 'checking';

  const onSubmit = () => {
    setTouched({ firstName: true, lastName: true, username: true, email: true, phone: true, password: true });
    if (!valid) return;
    if (!agreed) return toast.error('Please agree to the Terms and Privacy Policy.');
    registerMut.mutate();
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Join buyers and sellers across Nigeria. It takes a minute."
      footer={
        <View style={styles.footerRow}>
          <Text muted>Already have an account?</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text color={colors.primary} weight="semibold">
              {' '}
              Sign in
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.row}>
        <Input
          variant="filled"
          label="First name"
          placeholder="Tunde"
          value={form.firstName}
          onChangeText={set('firstName')}
          onBlur={blur('firstName')}
          error={show('firstName')}
          autoComplete="given-name"
          containerStyle={styles.half}
        />
        <Input
          variant="filled"
          label="Last name"
          placeholder="Bakare"
          value={form.lastName}
          onChangeText={set('lastName')}
          onBlur={blur('lastName')}
          error={show('lastName')}
          autoComplete="family-name"
          containerStyle={styles.half}
        />
      </View>
      <Input
        variant="filled"
        label="Username"
        placeholder="tundeb"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.username}
        onChangeText={set('username')}
        onBlur={blur('username')}
        hint={usernameState === 'available' ? 'Username is available' : undefined}
        error={usernameState === 'taken' ? 'Username is taken' : show('username')}
        rightAccessory={
          usernameState === 'checking' ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : usernameState === 'available' ? (
            <Check size={18} color={colors.success} />
          ) : usernameState === 'taken' ? (
            <X size={18} color={colors.danger} />
          ) : undefined
        }
      />
      <Input
        variant="filled"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={form.email}
        onChangeText={set('email')}
        onBlur={blur('email')}
        error={show('email')}
      />
      <Input
        variant="filled"
        label="Phone"
        placeholder="08012345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={11}
        value={form.phone}
        onChangeText={(v) => set('phone')(v.replace(/\D/g, ''))}
        onBlur={blur('phone')}
        error={show('phone')}
      />
      <Input
        variant="filled"
        label="Password"
        placeholder="Min. 8 characters"
        password
        autoComplete="new-password"
        value={form.password}
        onChangeText={set('password')}
        onBlur={blur('password')}
        error={show('password')}
        hint="8+ characters with upper and lower case, a number and a symbol"
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed((v) => !v)}
        style={styles.agree}
      >
        {agreed ? <SquareCheck size={22} color={colors.primary} /> : <Square size={22} color={colors.mutedLight} />}
        <Text variant="small" muted style={{ flex: 1 }}>
          I agree to URA&apos;s{' '}
          <Text variant="small" color={colors.primary} onPress={() => router.push('/(public)/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text variant="small" color={colors.primary} onPress={() => router.push('/(public)/privacy')}>
            Privacy Policy
          </Text>
          , including that there is no tolerance for objectionable content or abusive users.
        </Text>
      </Pressable>

      <Button
        title="Create account"
        size="lg"
        style={{ height: 54, borderRadius: 16 }}
        onPress={onSubmit}
        loading={registerMut.isPending}
        disabled={!canSubmit}
      />
      {GOOGLE_SIGN_IN_AVAILABLE ? (
        <>
          <AuthDivider label="or sign up with" />
          <GoogleButton label="Sign up with Google" />
        </>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  agree: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});
