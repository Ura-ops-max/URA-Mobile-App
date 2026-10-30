import { type ReactNode } from 'react';
import { View } from 'react-native';
import { radii, spacing, makeStyles } from '@/theme';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="subheading" center>
        {title}
      </Text>
      {message ? (
        <Text variant="body" muted center style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radii.xxl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: { maxWidth: 300 },
  action: { marginTop: spacing.md, paddingHorizontal: spacing.xxl },
}));
