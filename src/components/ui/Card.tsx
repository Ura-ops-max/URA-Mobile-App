import { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, shadow, spacing, makeStyles } from '@/theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, padded = true, elevated, style }: CardProps) {
  const styles = useStyles();
  const content = (
    <View style={[styles.card, padded && styles.padded, elevated && shadow.card, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.92 },
}));
