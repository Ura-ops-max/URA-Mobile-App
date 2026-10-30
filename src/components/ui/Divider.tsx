import { View, type ViewStyle } from 'react-native';
import { spacing, useTheme } from '@/theme';

export function Divider({ style, vertical }: { style?: ViewStyle; vertical?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: colors.border }
          : { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
        style,
      ]}
    />
  );
}
