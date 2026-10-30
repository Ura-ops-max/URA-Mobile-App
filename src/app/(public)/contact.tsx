// Contact (web pages/public/Contact): real contact details, and a form that
// opens the email app with the message filled in, like the website does.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react-native';
import { Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/constants/config';
import { InfoCard, InfoHero, LinkRow } from '@/components/info/InfoKit';

const phoneLabel = SUPPORT_PHONE.replace(/^\+234(\d{3})(\d{3})(\d{4})$/, '+234 $1 $2 $3');

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const open = (url: string, fallback: string) => Linking.openURL(url).catch(() => toast.error(fallback));

  const send = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }
    const subject = form.subject.trim() || `New enquiry from ${form.name.trim()}`;
    const body = `Name: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\n${form.message.trim()}`;
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      toast.success('Opening your email app to send the message…');
    } catch {
      toast.error(`Could not open your email app. Email us at ${SUPPORT_EMAIL}.`);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <InfoHero
        icon={MessageSquare}
        eyebrow="Contact"
        title="Get in touch"
        intro="Have a question, partnership idea, or need a hand? We'd love to hear from you; our team usually replies within a few hours."
      />

      <View style={styles.body}>
        <View style={styles.quick}>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}
            onPress={() => open(`mailto:${SUPPORT_EMAIL}`, 'Could not open your email app.')}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
              <Mail size={20} color={colors.primary} />
            </View>
            <Text variant="bodyMedium">Email</Text>
            <Text variant="small" muted numberOfLines={1}>
              {SUPPORT_EMAIL}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.85 }]}
            onPress={() => open(`tel:${SUPPORT_PHONE}`, 'Could not start a call.')}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.successSoft }]}>
              <Phone size={20} color={colors.success} />
            </View>
            <Text variant="bodyMedium">Call</Text>
            <Text variant="small" muted numberOfLines={1}>
              {phoneLabel}
            </Text>
          </Pressable>
        </View>

        <InfoCard>
          <LinkRow icon={MapPin} label="Office" value="Abuja, Nigeria" />
          <LinkRow icon={Clock} label="Hours" value="Mon – Sat, 9am – 6pm" />
        </InfoCard>

        <InfoCard icon={Send} title="Send us a message">
          <Input variant="filled" placeholder="Your name" value={form.name} onChangeText={set('name')} />
          <Input
            variant="filled"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={set('email')}
          />
          <Input variant="filled" placeholder="Subject (optional)" value={form.subject} onChangeText={set('subject')} />
          <Input
            variant="filled"
            placeholder="How can we help?"
            multiline
            value={form.message}
            onChangeText={set('message')}
            style={styles.textarea}
          />
          <Button
            title="Send message"
            leftIcon={<Send size={16} color={colors.white} />}
            onPress={() => void send()}
            disabled={!form.name || !form.email || !form.message}
          />
          <Text variant="small" muted center>
            Opens your email app with your message ready to send.
          </Text>
        </InfoCard>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  body: { padding: spacing.lg, gap: spacing.md },
  quick: { flexDirection: 'row', gap: spacing.md },
  quickBtn: {
    flex: 1,
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  quickIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
}));
