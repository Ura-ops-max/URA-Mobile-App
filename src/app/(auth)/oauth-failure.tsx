import { View } from 'react-native';
import { router } from 'expo-router';
import { XCircle } from 'lucide-react-native';
import { Button, Text } from '@/components/ui';
import { spacing, useTheme, makeStyles } from '@/theme';

export default function OAuthFailureScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <XCircle size={56} color={colors.danger} />
      <Text variant="heading">Sign-in failed</Text>
      <Text muted center>
        We couldn&apos;t sign you in with Google. Please try again or use your email and password.
      </Text>
      <Button title="Back to login" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: spacing.lg }} fullWidth={false} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xxl, backgroundColor: colors.background },
}));
