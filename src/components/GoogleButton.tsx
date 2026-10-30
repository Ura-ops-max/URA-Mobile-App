import { ActivityIndicator, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text, useToast } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { GOOGLE_SIGN_IN_AVAILABLE, useGoogleSignIn } from '@/hooks/use-google-sign-in';

/** Google's multicolour "G". */
function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}

/** "Continue with Google" — hidden where Google sign-in isn't offered (see use-google-sign-in). */
export function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { signIn, loading } = useGoogleSignIn();
  if (!GOOGLE_SIGN_IN_AVAILABLE) return null;

  const onPress = async () => {
    const r = await signIn();
    if (r === 'failed') toast.error("We couldn't sign you in with Google. Please try again.");
    else if (r === 'cancel') toast.show('Google sign-in was not completed.');
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void onPress()}
      disabled={loading}
      style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.surfaceAlt }, loading && { opacity: 0.6 }]}
    >
      <View style={styles.icon}>{loading ? <ActivityIndicator color={colors.muted} /> : <GoogleG />}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  btn: {
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon: { width: 22, alignItems: 'center' },
  label: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
}));
