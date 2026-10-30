import { Pressable, StyleSheet, View } from 'react-native';
import { categoryColor } from '@/lib/category-colors';
import { fontFamily, fontSize, radii, spacing, useTheme } from '@/theme';
import { Text } from './Text';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryChip({ label, active, onPress, showDot = true, size = 'md' }: CategoryChipProps) {
  const { colors, scheme } = useTheme();
  const light = categoryColor(label);
  // Dark mode: a translucent tint of the category colour instead of a pastel fill.
  const c =
    scheme === 'dark'
      ? { bg: `${light.dot}26`, text: light.dot, dot: light.dot, softBorder: `${light.dot}40` }
      : light;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        size === 'sm' && styles.chipSm,
        {
          backgroundColor: active ? colors.primary : c.bg,
          borderColor: active ? colors.primary : c.softBorder,
        },
      ]}
    >
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: active ? colors.white : c.dot }]} />
      ) : null}
      <Text
        style={{
          color: active ? colors.white : c.text,
          fontFamily: fontFamily.semibold,
          fontSize: size === 'sm' ? fontSize.xs : fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSm: { paddingVertical: 5, paddingHorizontal: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
