import { type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { radii, useTheme, makeStyles } from '@/theme';
import { Text } from './Text';

interface IconButtonProps {
  icon: ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: 'plain' | 'surface' | 'soft';
  badgeCount?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  variant = 'plain',
  badgeCount,
  style,
  disabled,
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const bg =
    variant === 'surface' ? colors.surface : variant === 'soft' ? colors.primarySoft : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          backgroundColor: bg,
          borderWidth: variant === 'surface' ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon}
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  btn: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
}));
