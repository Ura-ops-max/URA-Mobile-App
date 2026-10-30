// Delete account (App Store 5.1.1(v), Google Play account-deletion policy).
// The backend has no self-service delete endpoint yet, so the request goes to
// URA support by email from inside the app, with the account's details filled
// in. The same address is listed as the web deletion route in the store forms.
import { useState } from 'react';
import { Linking, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Mail } from 'lucide-react-native';
import { Button, Text, useToast } from '@/components/ui';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { SUPPORT_EMAIL } from '@/constants/config';

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { user, logout } = useAuthContext();
  const [confirmText, setConfirmText] = useState('');
  const [sent, setSent] = useState(false);
  const ready = confirmText.trim().toUpperCase() === 'DELETE';

  const request = async () => {
    if (!user) return;
    const subject = 'Delete my URA account';
    const body = [
      'Please permanently delete my URA account and its personal data.',
      '',
      `Name: ${user.firstName} ${user.lastName}`,
      `Username: ${user.username}`,
      `Email: ${user.email}`,
      `Account id: ${user._id}`,
      user.isBusinessOwner && user.business?.businessName ? `Shop: ${user.business.businessName}` : '',
      '',
      'Sent from the URA app.',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      );
      setSent(true);
    } catch {
      toast.error(`Could not open your email app. Email ${SUPPORT_EMAIL} from ${user.email}.`);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.warn}>
        <AlertTriangle size={22} color={colors.danger} />
        <Text variant="subheading" color={colors.danger}>
          Delete your account
        </Text>
      </View>
      <Text variant="body">
        Deleting your account removes your profile, posts, products, shop page, followers, bookmarks and chats from URA.
        This can&apos;t be undone.
      </Text>
      <Text variant="body" muted>
        Before you delete: withdraw any money in your wallet, and finish or cancel open orders. Order and payment records
        that the law requires us to keep are kept for that period only.
      </Text>
      <Text variant="body" muted>
        Your request is sent to URA support ({SUPPORT_EMAIL}) from your email app. We confirm by email and delete the
        account within 30 days.
      </Text>

      {sent ? (
        <View style={styles.sent}>
          <Mail size={18} color={colors.success} />
          <Text variant="body" style={{ flex: 1 }}>
            Your email app opened with the request. Send it to finish. You can sign out now.
          </Text>
        </View>
      ) : null}

      <Text variant="label">Type DELETE to confirm</Text>
      <TextInput
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="DELETE"
        placeholderTextColor={colors.mutedLight}
        style={styles.input}
      />
      <Button title="Request account deletion" variant="danger" disabled={!ready} onPress={() => void request()} />
      {sent ? (
        <Button
          title="Sign out"
          variant="outline"
          onPress={() => {
            logout();
            router.replace('/(auth)/login');
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  warn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sent: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.successSoft, borderRadius: radii.md, padding: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
}));
