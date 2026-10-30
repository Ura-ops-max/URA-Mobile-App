import { StyleSheet, View } from 'react-native';
import { fontFamily, fontSize, useTheme } from '@/theme';
import { formatNaira } from '@/lib/format';
import { Text } from './Text';

interface PriceTagProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  strikethrough?: number;
}

const SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: fontSize.sm,
  md: fontSize.md,
  lg: fontSize.xl,
};

export function PriceTag({ amount, size = 'md', color: colorProp, strikethrough }: PriceTagProps) {
  const { colors } = useTheme();
  const color = colorProp ?? colors.text;
  return (
    <View style={styles.row}>
      <Text style={{ color, fontFamily: fontFamily.bold, fontSize: SIZE[size] }}>
        {formatNaira(amount)}
      </Text>
      {strikethrough ? (
        <Text
          muted
          style={{
            fontSize: SIZE[size] - 3,
            textDecorationLine: 'line-through',
            fontFamily: fontFamily.regular,
          }}
        >
          {formatNaira(strikethrough)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
