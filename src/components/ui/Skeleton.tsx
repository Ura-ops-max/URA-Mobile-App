import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radii, useTheme, makeStyles } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt },
        animated,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Skeleton height={180} radius={radii.md} />
      <View style={styles.row}>
        <Skeleton width={36} height={36} radius={18} />
        <View style={styles.col}>
          <Skeleton width="60%" height={12} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
      <Skeleton width="80%" height={14} />
      <Skeleton width="30%" height={18} />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  col: { gap: 6, flex: 1 },
}));
