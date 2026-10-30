import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { spacing, useTheme } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Adds horizontal 16px gutter to the content. */
  padded?: boolean;
  edges?: Edge[];
  backgroundColor?: string;
  style?: ViewStyle;
}

export function Screen({
  children,
  padded = false,
  edges = ['top', 'left', 'right'],
  backgroundColor: backgroundProp,
  style,
}: ScreenProps) {
  const { colors } = useTheme();
  const backgroundColor = backgroundProp ?? colors.background;
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});
