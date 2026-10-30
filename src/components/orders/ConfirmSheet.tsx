import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Sheet, Text } from '@/components/ui';
import { spacing } from '@/theme';

/** A yes/no bottom sheet for an order action ("Confirm delivery", "Cancel this order?"...). */
export function ConfirmSheet({
  visible,
  title,
  text,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy,
  onConfirm,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Sheet visible={visible} onClose={busy ? () => {} : onClose} title={title}>
      <View style={{ gap: spacing.lg }}>
        <Text variant="body" muted>
          {text}
        </Text>
        {children}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title={cancelLabel} variant="outline" onPress={onClose} disabled={busy} style={{ flex: 1 }} fullWidth={false} />
          <Button
            title={confirmLabel}
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onPress={onConfirm}
            loading={busy}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        </View>
      </View>
    </Sheet>
  );
}
