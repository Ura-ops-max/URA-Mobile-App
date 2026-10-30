import { forwardRef, type ReactNode, useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightAccessory?: ReactNode;
  password?: boolean;
  containerStyle?: ViewStyle;
  /** 'filled': soft grey field with a focus ring (auth screens). */
  variant?: 'outline' | 'filled';
}

export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { label, error, hint, leftIcon, rightAccessory, password, containerStyle, variant = 'outline', style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!password);

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          variant === 'filled' && styles.filled,
          focused && { borderColor: colors.primary },
          focused && variant === 'filled' && styles.filledFocused,
          !!error && { borderColor: colors.danger },
        ]}
      >
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          maxFontSizeMultiplier={1.2}
          placeholderTextColor={colors.mutedLight}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.right}>
            {hidden ? (
              <EyeOff size={18} color={colors.muted} />
            ) : (
              <Eye size={18} color={colors.muted} />
            )}
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.right}>{rightAccessory}</View>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" color={colors.danger} style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" muted style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.xs },
  label: { color: colors.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
  },
  filled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  filledFocused: { backgroundColor: colors.surface },
  left: { marginRight: spacing.sm },
  right: { marginLeft: spacing.sm },
  helper: { marginTop: 2 },
}));
