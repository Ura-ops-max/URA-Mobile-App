import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { fontFamily, fontSize, radii, spacing, useTheme } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 46, lg: 50 };
const FONT: Record<Size, number> = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.md };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.primarySoft,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.danger,
  };
  const fg: Record<Variant, string> = {
    primary: colors.white,
    secondary: colors.primary,
    outline: colors.text,
    ghost: colors.primary,
    danger: colors.white,
  };
  const border: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    outline: colors.border,
    ghost: undefined,
    danger: undefined,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: bg[variant],
          borderWidth: border[variant] ? 1 : 0,
          borderColor: border[variant],
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text
            style={{ color: fg[variant], fontFamily: fontFamily.semibold, fontSize: FONT[size] }}
          >
            {title}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  full: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
