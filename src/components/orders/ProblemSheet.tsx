import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FileText, ImageIcon, X } from 'lucide-react-native';
import { Button, Sheet, Text, useToast } from '@/components/ui';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { apiErrorMessage, submitDispute, type DisputeFile } from '@/api/orders';
import { useSubmitLock } from '@/hooks/use-submit-lock';

const MAX_BYTES = 5 * 1024 * 1024;

/** Buyer reports a problem (Buyer-Protected); the seller responds once one is open. */
export function ProblemSheet({
  visible,
  orderId,
  asSeller,
  onClose,
  onDone,
}: {
  visible: boolean;
  orderId: string;
  asSeller: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<DisputeFile | null>(null);
  const [sending, setSending] = useState(false);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    if (a.fileSize && a.fileSize > MAX_BYTES) return toast.error('That file is over 5 MB.');
    setFile({ uri: a.uri, name: a.fileName ?? `photo-${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg' });
  };

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > MAX_BYTES) return toast.error('That file is over 5 MB.');
    setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf' });
  };

  const lock = useSubmitLock();
  const submit = () =>
    lock(async () => {
      if (!message.trim()) return;
      setSending(true);
      try {
        await submitDispute(orderId, message.trim(), file);
        toast.success(asSeller ? 'Your response was sent.' : 'Problem reported. URA will look into it.');
        setMessage('');
        setFile(null);
        onDone();
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Could not send. Please try again.'));
      } finally {
        setSending(false);
      }
    });

  return (
    <Sheet visible={visible} onClose={sending ? () => {} : onClose} title={asSeller ? 'Respond to problem' : 'Report a problem'}>
      <View style={{ gap: spacing.md }}>
        <Text variant="body" muted>
          {asSeller
            ? 'Explain your side. You can respond once.'
            : 'The money stays on hold while URA looks into it. You can report once.'}
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          maxLength={2000}
          multiline
          placeholder={asSeller ? 'Your response' : 'What went wrong?'}
          placeholderTextColor={colors.mutedLight}
          style={styles.textarea}
          textAlignVertical="top"
        />
        <Text variant="label" muted>
          Photo or PDF (optional, up to 5 MB)
        </Text>
        {file ? (
          <View style={styles.file}>
            {file.mimeType === 'application/pdf' ? (
              <FileText size={18} color={colors.primary} />
            ) : (
              <ImageIcon size={18} color={colors.primary} />
            )}
            <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
              {file.name}
            </Text>
            <Pressable onPress={() => setFile(null)} hitSlop={10} accessibilityLabel="Remove file">
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.row}>
            <Button title="Add photo" variant="outline" size="sm" fullWidth={false} onPress={pickPhoto} leftIcon={<ImageIcon size={16} color={colors.text} />} />
            <Button title="Add PDF" variant="outline" size="sm" fullWidth={false} onPress={pickPdf} leftIcon={<FileText size={16} color={colors.text} />} />
          </View>
        )}
        <View style={styles.row}>
          <Button title="Cancel" variant="outline" onPress={onClose} disabled={sending} style={{ flex: 1 }} fullWidth={false} />
          <Button title="Send" variant="danger" onPress={submit} loading={sending} disabled={!message.trim()} style={{ flex: 1 }} fullWidth={false} />
        </View>
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((colors) => ({
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  row: { flexDirection: 'row', gap: spacing.md },
}));
