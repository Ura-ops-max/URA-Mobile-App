import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { MessageCircle, Square, SquareCheck } from 'lucide-react-native';
import { Text, useToast } from '@/components/ui';
import { fontFamily, radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatNaira } from '@/lib/format';
import { buyerOrderMessage, whatsAppLink } from '@/lib/whatsapp';

const WHATSAPP_GREEN = '#25D366';

/** Green WhatsApp click-to-chat button. Hidden when the phone number isn't usable. */
export function WhatsAppButton({ phone, text, label }: { phone?: string | null; text: string; label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const href = whatsAppLink(phone, text);
  if (!href) return null;
  return (
    <View>
      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL(href).catch(() => toast.error('Could not open WhatsApp.'))}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
      >
        <MessageCircle size={20} color={colors.white} />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <Text variant="small" muted style={{ marginTop: 6 }}>
        Opens WhatsApp. You tap Send.
      </Text>
    </View>
  );
}

export interface SendOrderToShopProps {
  shopName: string;
  shopPhone: string | null | undefined;
  orderNumber: string;
  items: { name: string; quantity: number }[];
  total: number;
  paid: boolean;
  deliveryMethod?: string;
  address?: string | null;
}

/** "Send order details to <shop> on WhatsApp", with "Include what I ordered". */
export function SendOrderToShop(props: SendOrderToShopProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [includeItems, setIncludeItems] = useState(true);
  if (!whatsAppLink(props.shopPhone, 'x')) return null;
  const text = buyerOrderMessage({ ...props, totalText: formatNaira(props.total), includeItems });
  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: includeItems }}
        onPress={() => setIncludeItems((v) => !v)}
        style={styles.check}
      >
        {includeItems ? (
          <SquareCheck size={22} color={WHATSAPP_GREEN} />
        ) : (
          <Square size={22} color={colors.mutedLight} />
        )}
        <Text variant="body">Include what I ordered</Text>
      </Pressable>
      <WhatsAppButton
        phone={props.shopPhone}
        text={text}
        label={`Send order details to ${props.shopName} on WhatsApp`}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: { color: colors.white, fontFamily: fontFamily.semibold, flexShrink: 1, textAlign: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
}));
