import { Pressable } from 'react-native';
import type { ComponentProps } from 'react';
import { router, type Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { fontFamily, useTheme, makeStyles } from '@/theme';

/** Round back button for every stack header. Goes Home when there is nothing to go back to. */
export function HeaderBack() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
    >
      <ChevronLeft size={22} color={colors.text} />
    </Pressable>
  );
}

type StackOptions = Exclude<ComponentProps<typeof Stack>['screenOptions'], (...args: never[]) => unknown>;

/** Header look shared by every Stack (root, wallet, settings, public pages), for the current theme. */
export function useStackScreenOptions(): StackOptions {
  const { colors } = useTheme();
  return {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fontFamily.semibold, color: colors.text, fontSize: 17 },
  headerTitleAlign: 'center',
  headerTintColor: colors.text,
  headerBackVisible: false,
  headerLeft: () => <HeaderBack />,
  contentStyle: { backgroundColor: colors.background },
  };
}

const useStyles = makeStyles((colors) => ({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
