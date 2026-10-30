// Opened by the App Link https://www.ura.com.ng/auth/oauth/success?accessToken&refreshToken
// (where the backend sends people after Google sign-in), or ura://auth/oauth/success.
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { captureOAuthToken } from '@/api/auth';
import { consumeOAuthPending } from '@/hooks/use-google-sign-in';
import { useAuthContext } from '@/context/auth-provider';
import { Text } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';

export default function OAuthSuccessScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { accessToken, refreshToken } = useLocalSearchParams<{ accessToken?: string; refreshToken?: string }>();
  const { refetchAuth } = useAuthContext();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      // Only a Google sign-in this app started recently may hand over tokens.
      if (accessToken && refreshToken && (await consumeOAuthPending())) {
        await captureOAuthToken(accessToken, refreshToken);
        await refetchAuth();
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/oauth-failure');
      }
    })();
  }, [accessToken, refreshToken, refetchAuth]);

  return (
    <View style={styles.wrap}>
      <CheckCircle2 size={56} color={colors.success} />
      <Text variant="heading">Signing you in…</Text>
      <Text muted center>
        Your Google account has been verified. Taking you to URA.
      </Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
}));
