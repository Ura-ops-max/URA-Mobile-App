import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronDown, Store } from 'lucide-react-native';
import { Button, Input, Sheet, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { becomeSeller } from '@/api/users';
import { apiErrorMessage } from '@/api/orders';
import { fetchProductCategories } from '@/api/feed';
import { useAuthContext } from '@/context/auth-provider';
import { NIGERIAN_STATES } from '@/lib/nigeria';

export default function BecomeSellerScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { user, refetchAuth } = useAuthContext();
  const [acknowledged, setAcknowledged] = useState(false);
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchProductCategories });
  const [form, setForm] = useState({ businessName: '', category: '', about: '', phone: '', street: '', city: '', state: 'Lagos' });
  const [catOpen, setCatOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => becomeSeller(form),
    onSuccess: async (shop) => {
      await refetchAuth();
      toast.success('Welcome to Business Mode! Your shop is live.');
      if (shop?._id) router.replace(`/business/${shop._id}`);
      else router.back();
      if (!user?.paylukCustomerId) {
        Alert.alert('Get paid for your sales', 'Set up your payment profile so buyers can pay you.', [
          { text: 'Later', style: 'cancel' },
          { text: 'Set up now', onPress: () => router.push('/payluk-setup') },
        ]);
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create business account')),
  });

  const canSubmit = form.businessName.trim().length >= 2 && form.category && form.phone.length >= 10 && form.city;

  // Already a business: edit the shop instead.
  if (user?.isBusinessOwner && !mut.isPending && !mut.isSuccess) return <Redirect href="/settings/business" />;

  // Same warning as the website (BusinessWarningModal): this can't be undone.
  if (!acknowledged) {
    return (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.dangerSoft }]}>
            <AlertTriangle size={26} color={colors.danger} />
          </View>
          <Text variant="heading" center>This is permanent</Text>
          <Text variant="body" muted center style={{ maxWidth: 320 }}>
            Converting to a Business Account lets you list products, receive orders and get reviews. Because business
            data (orders, reviews, products) is linked to your identity, you cannot switch back to a regular account
            later.
          </Text>
        </View>
        <Button title="I understand, continue" onPress={() => setAcknowledged(true)} />
        <Button title="Not now" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Store size={26} color={colors.primary} /></View>
        <Text variant="heading" center>Start selling on URA</Text>
        <Text variant="caption" muted center style={{ maxWidth: 300 }}>
          Set up your business profile to list products, receive orders and get paid with Buyer-Protected Payment.
        </Text>
      </View>

      <Input label="Business name" placeholder="e.g. Adaeze Threads" value={form.businessName} onChangeText={set('businessName')} />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Category</Text>
        <Pressable style={styles.select} onPress={() => setCatOpen(true)}>
          <Text color={form.category ? colors.text : colors.mutedLight}>{form.category || 'Select a category'}</Text>
          <ChevronDown size={18} color={colors.muted} />
        </Pressable>
      </View>
      <Input label="About your business" placeholder="What do you sell?" value={form.about} onChangeText={set('about')} multiline style={styles.textarea} />
      <Input label="Business phone" placeholder="08012345678" keyboardType="phone-pad" maxLength={14} value={form.phone} onChangeText={set('phone')} />
      <Input label="Street address" placeholder="Street, area" value={form.street} onChangeText={set('street')} />
      <View style={styles.row}>
        <Input label="City" placeholder="City" value={form.city} onChangeText={set('city')} containerStyle={{ flex: 1 }} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="label">State</Text>
          <Pressable style={styles.select} onPress={() => setStateOpen(true)}>
            <Text>{form.state}</Text>
            <ChevronDown size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <Button title="Create business account" onPress={() => mut.mutate()} loading={mut.isPending} disabled={!canSubmit} style={{ marginTop: spacing.sm }} />

      <Sheet visible={catOpen} onClose={() => setCatOpen(false)} title="Select category">
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {(categories ?? []).map((c) => (
            <Pressable key={c} style={styles.opt} onPress={() => { set('category')(c); setCatOpen(false); }}>
              <Text>{c}</Text>
              {form.category === c ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
      <Sheet visible={stateOpen} onClose={() => setStateOpen(false)} title="Select state">
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {NIGERIAN_STATES.map((s) => (
            <Pressable key={s} style={styles.opt} onPress={() => { set('state')(s); setStateOpen(false); }}>
              <Text color={s === form.state ? colors.primary : colors.text}>{s}</Text>
              {s === form.state ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  heroIcon: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, minHeight: 46, backgroundColor: colors.surface },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
}));
