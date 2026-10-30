import { StyleSheet, View, type ViewStyle } from 'react-native';
import { fontFamily, fontSize, radii, spacing, useTheme, type Colors } from '@/theme';
import { Text } from './Text';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

const tones = (colors: Colors): Record<Tone, { bg: string; fg: string }> => ({
  neutral: { bg: colors.surfaceAlt, fg: colors.muted },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  info: { bg: colors.infoSoft, fg: colors.info },
});

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const { colors } = useTheme();
  const t = tones(colors)[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={{ color: t.fg, fontFamily: fontFamily.semibold, fontSize: fontSize.xs }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
