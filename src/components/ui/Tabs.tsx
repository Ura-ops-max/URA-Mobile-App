import { ScrollView, Pressable, View } from 'react-native';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { Text } from './Text';

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  variant?: 'underline' | 'pill';
  scrollable?: boolean;
}

export function Tabs({ items, value, onChange, variant = 'underline', scrollable }: TabsProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const content = items.map((item) => {
    const active = item.key === value;
    if (variant === 'pill') {
      return (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          style={[styles.pill, { backgroundColor: active ? colors.primary : colors.surfaceAlt }]}
        >
          <Text
            style={{
              color: active ? colors.white : colors.muted,
              fontFamily: fontFamily.semibold,
              fontSize: fontSize.sm,
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      );
    }
    return (
      <Pressable key={item.key} onPress={() => onChange(item.key)} style={styles.underlineItem}>
        <Text
          style={{
            color: active ? colors.primary : colors.muted,
            fontFamily: active ? fontFamily.semibold : fontFamily.medium,
            fontSize: fontSize.base,
          }}
        >
          {item.label}
        </Text>
        <View style={[styles.underline, { backgroundColor: active ? colors.primary : 'transparent' }]} />
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={variant === 'pill' ? styles.pillRow : styles.underlineRow}
      >
        {content}
      </ScrollView>
    );
  }
  return <View style={variant === 'pill' ? styles.pillRow : styles.underlineRowFixed}>{content}</View>;
}

const useStyles = makeStyles((colors) => ({
  pillRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  underlineRow: { flexDirection: 'row', gap: spacing.xl },
  underlineRowFixed: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pill: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill },
  underlineItem: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  underline: { height: 3, width: '100%', borderRadius: 3 },
}));
