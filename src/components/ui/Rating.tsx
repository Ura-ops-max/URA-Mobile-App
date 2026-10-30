import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { fontFamily, fontSize, useTheme } from '@/theme';
import { Text } from './Text';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  editable?: boolean;
  onChange?: (v: number) => void;
}

export function Rating({ value, count, size = 14, showValue, editable, onChange }: RatingProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = (
          <Star
            size={size}
            color={colors.star}
            fill={filled ? colors.star : 'transparent'}
          />
        );
        return editable ? (
          <Pressable key={i} onPress={() => onChange?.(i)} hitSlop={4}>
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
      {showValue ? (
        <Text style={{ color: colors.text, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, marginLeft: 4 }}>
          {value.toFixed(1)}
        </Text>
      ) : null}
      {typeof count === 'number' ? (
        <Text muted style={{ fontSize: fontSize.sm, marginLeft: 2 }}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
