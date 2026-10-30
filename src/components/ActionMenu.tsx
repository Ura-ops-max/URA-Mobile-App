import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MoreVertical, type LucideIcon } from 'lucide-react-native';
import { Sheet, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';

export interface MenuAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
  show?: boolean;
}

interface ActionMenuProps {
  actions: MenuAction[];
  size?: number;
  color?: string;
}

export function ActionMenu({ actions, size = 18, color: colorProp }: ActionMenuProps) {
  const { colors } = useTheme();
  const color = colorProp ?? colors.muted;
  const [open, setOpen] = useState(false);
  const visible = actions.filter((a) => a.show !== false);
  if (visible.length === 0) return null;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={styles.trigger}>
        <MoreVertical size={size} color={color} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.list}>
          {visible.map((action) => (
            <Pressable
              key={action.label}
              style={styles.row}
              onPress={() => {
                setOpen(false);
                setTimeout(action.onPress, 150);
              }}
            >
              <action.icon size={20} color={action.danger ? colors.danger : colors.text} />
              <Text variant="body" color={action.danger ? colors.danger : colors.text}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { padding: 4, borderRadius: radii.pill },
  list: { paddingBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
