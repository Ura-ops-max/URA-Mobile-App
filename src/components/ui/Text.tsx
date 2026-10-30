import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { fontFamily, fontSize, MAX_FONT_SCALE, useTheme } from '@/theme';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption'
  | 'small';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  center?: boolean;
  muted?: boolean;
}

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: fontSize.xxxl, fontFamily: fontFamily.bold, lineHeight: 32 },
  title: { fontSize: fontSize.xxl, fontFamily: fontFamily.bold, lineHeight: 27 },
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.semibold, lineHeight: 24 },
  subheading: { fontSize: fontSize.lg, fontFamily: fontFamily.semibold, lineHeight: 22 },
  body: { fontSize: fontSize.base, fontFamily: fontFamily.regular, lineHeight: 19 },
  bodyMedium: { fontSize: fontSize.base, fontFamily: fontFamily.medium, lineHeight: 19 },
  label: { fontSize: fontSize.sm, fontFamily: fontFamily.medium, lineHeight: 17 },
  caption: { fontSize: 12, fontFamily: fontFamily.regular, lineHeight: 16 },
  small: { fontSize: fontSize.xs, fontFamily: fontFamily.medium, lineHeight: 15 },
};

const WEIGHTS: Record<Weight, string> = {
  regular: fontFamily.regular,
  medium: fontFamily.medium,
  semibold: fontFamily.semibold,
  bold: fontFamily.bold,
};

export function Text({
  variant = 'body',
  weight,
  color,
  center,
  muted,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      style={[
        VARIANTS[variant],
        { color: muted ? colors.muted : color ?? colors.text },
        weight ? { fontFamily: WEIGHTS[weight] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
