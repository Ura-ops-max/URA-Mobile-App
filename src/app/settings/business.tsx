// Edit Shop (web components/settings/form/BusinessInfoForm): the shop's logo,
// cover, details, location, Google visibility and opening hours, saved with
// PATCH /users/me/business (flat fields).
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, ChevronDown, Clock, Globe, MapPin, Phone, Store } from 'lucide-react-native';
import { Avatar, Button, Input, Sheet, Text, useToast } from '@/components/ui';
import { fontFamily, fontSize, radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { getBusinessProfile, updateBusiness } from '@/api/users';
import { apiErrorMessage } from '@/api/orders';
import { NIGERIAN_STATES } from '@/lib/nigeria';
import type { BusinessType } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['Restaurant', 'Retail', 'Services', 'Technology'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Hour = { day: string; open: string; close: string; closed: boolean };

export default function EditShopScreen() {
  const { user } = useAuthContext();
  const shopId = user?.business?._id;
  const { colors } = useTheme();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['business', shopId, 'edit'],
    queryFn: () => getBusinessProfile(shopId!),
    enabled: !!shopId,
  });

  if (user && !user.isBusinessOwner) return <Redirect href="/become-seller" />;
  if (isLoading || !data?.business) {
    return isError ? (
      <Text muted center style={{ marginTop: 60 }}>
        Could not load your shop.
      </Text>
    ) : (
      <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
    );
  }
  // Keyed so the form starts from the loaded shop.
  return <ShopForm key={data.business._id} business={data.business} />;
}

function ShopForm({ business }: { business: BusinessType }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const qc = useQueryClient();
  const { refetchAuth } = useAuthContext();

  const [logo, setLogo] = useState<string | null>(business.businessLogo || null);
  const [cover, setCover] = useState<string | null>(business.businessCover || null);
  const [form, setForm] = useState({
    businessName: business.businessName ?? '',
    category: business.category ?? '',
    about: business.about ?? '',
    phone: business.contact?.phone ?? '',
    website: business.contact?.website ?? '',
    fullAddress: business.address?.fullAddress ?? '',
    city: business.address?.city ?? '',
    state: business.address?.state ?? '',
    area: business.area ?? '',
  });
  const [google, setGoogle] = useState({
    showOnGoogle: business.showOnGoogle !== false,
    hasPhysicalStore: business.hasPhysicalStore === true,
    showStreetAddress: business.showStreetAddress === true,
  });
  const [hours, setHours] = useState<Hour[]>(() =>
    DAYS.map((day) => {
      const h = (business.operatingHours ?? []).find((x) => x.day === day);
      const closed = !h || h.open === 'Closed' || h.close === 'Closed';
      return { day, open: h && !closed ? h.open : '09:00', close: h && !closed ? h.close : '17:00', closed: h ? closed : false };
    }),
  );
  const [picker, setPicker] = useState<'category' | 'state' | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setHour = (day: string, patch: Partial<Hour>) =>
    setHours((all) => all.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const pick = async (setter: (uri: string) => void, aspect: [number, number]) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Photo permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.75 });
    if (!res.canceled) setter(res.assets[0].uri);
  };

  const badHour = hours.find((h) => !h.closed && (!TIME_RE.test(h.open) || !TIME_RE.test(h.close)));
  const nameError = form.businessName.trim().length < 2 ? 'Business name must be at least 2 characters' : undefined;
  const websiteError =
    form.website.trim() && !/^https?:\/\/\S+\.\S+/.test(form.website.trim())
      ? 'Start the website with https://'
      : undefined;

  const mut = useMutation({
    mutationFn: () =>
      updateBusiness({
        businessName: form.businessName.trim(),
        category: form.category || undefined,
        about: form.about.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        fullAddress: form.fullAddress.trim(),
        city: form.city.trim(),
        state: form.state,
        area: form.area.trim(),
        showOnGoogle: google.showOnGoogle,
        hasPhysicalStore: google.hasPhysicalStore,
        showStreetAddress: google.hasPhysicalStore && google.showStreetAddress,
        operatingHours: hours.map((h) => ({
          day: h.day,
          open: h.closed ? 'Closed' : h.open,
          close: h.closed ? 'Closed' : h.close,
        })),
        // Only send images that changed (local file → uploaded to S3 first).
        ...(logo && logo !== business.businessLogo ? { businessLogo: logo } : {}),
        ...(cover && cover !== business.businessCover ? { businessCover: cover } : {}),
      }),
    onSuccess: async () => {
      await refetchAuth();
      void qc.invalidateQueries({ queryKey: ['business'] });
      void qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Shop updated');
      router.back();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save your shop. Please try again.')),
  });

  const canSave = !nameError && !websiteError && !badHour && !mut.isPending;
  const categories = form.category && !CATEGORIES.includes(form.category) ? [form.category, ...CATEGORIES] : CATEGORIES;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.cover} onPress={() => void pick(setCover, [16, 9])}>
        {cover ? <Image source={{ uri: cover }} style={styles.coverImg} contentFit="cover" /> : <View style={[styles.coverImg, { backgroundColor: colors.primarySoft }]} />}
        <View style={styles.chip}>
          <Camera size={16} color={colors.white} />
          <Text variant="small" color={colors.white}>Change cover</Text>
        </View>
      </Pressable>
      <View style={styles.logoRow}>
        <Pressable onPress={() => void pick(setLogo, [1, 1])}>
          <Avatar uri={logo} name={form.businessName || 'Shop'} size={88} />
          <View style={styles.logoEdit}>
            <Camera size={15} color={colors.white} />
          </View>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Section icon={<Store size={16} color={colors.primary} />} title="Shop details">
          <Input label="Business name" value={form.businessName} onChangeText={set('businessName')} error={nameError} maxLength={100} />
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">Category</Text>
            <Pressable style={styles.select} onPress={() => setPicker('category')}>
              <Text color={form.category ? colors.text : colors.mutedLight}>{form.category || 'Select a category'}</Text>
              <ChevronDown size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Input label="About the business" value={form.about} onChangeText={set('about')} multiline style={styles.textarea} maxLength={500} />
        </Section>

        <Section icon={<Phone size={16} color={colors.primary} />} title="Contact">
          <Input label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="08012345678" />
          <Input
            label="Website"
            value={form.website}
            onChangeText={set('website')}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://"
            error={websiteError}
            leftIcon={<Globe size={16} color={colors.muted} />}
          />
        </Section>

        <Section icon={<MapPin size={16} color={colors.primary} />} title="Location">
          <Input label="Street address" value={form.fullAddress} onChangeText={set('fullAddress')} />
          <View style={styles.row}>
            <Input label="City" value={form.city} onChangeText={set('city')} containerStyle={{ flex: 1 }} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text variant="label">State</Text>
              <Pressable style={styles.select} onPress={() => setPicker('state')}>
                <Text color={form.state ? colors.text : colors.mutedLight}>{form.state || 'Select'}</Text>
                <ChevronDown size={18} color={colors.muted} />
              </Pressable>
            </View>
          </View>
          <Input
            label="Area"
            value={form.area}
            onChangeText={set('area')}
            maxLength={80}
            placeholder="e.g. Wuse 2"
            hint="Add your area so nearby shoppers find you. State and city also set your delivery pickup point."
          />
        </Section>

        <Section icon={<Globe size={16} color={colors.primary} />} title="Google">
          <Toggle
            label="Show my shop on Google"
            value={google.showOnGoogle}
            onChange={(v) => setGoogle((g) => ({ ...g, showOnGoogle: v }))}
          />
          <Toggle
            label="Customers can visit my shop"
            value={google.hasPhysicalStore}
            onChange={(v) => setGoogle((g) => ({ ...g, hasPhysicalStore: v, showStreetAddress: v ? g.showStreetAddress : false }))}
          />
          {google.hasPhysicalStore ? (
            <Toggle
              label="Show my street address"
              hint="Off: people see only your area, city and state."
              value={google.showStreetAddress}
              onChange={(v) => setGoogle((g) => ({ ...g, showStreetAddress: v }))}
            />
          ) : null}
        </Section>

        <Section icon={<Clock size={16} color={colors.primary} />} title="Opening hours">
          {hours.map((h) => (
            <View key={h.day} style={styles.hourRow}>
              <View style={{ width: 92 }}>
                <Text variant="bodyMedium">{h.day.slice(0, 3)}</Text>
                <Text variant="small" color={h.closed ? colors.danger : colors.success}>{h.closed ? 'Closed' : 'Open'}</Text>
              </View>
              <Switch
                value={!h.closed}
                onValueChange={(on) => setHour(h.day, { closed: !on })}
                trackColor={{ true: colors.success, false: colors.border }}
                accessibilityLabel={`${h.day} open`}
              />
              {!h.closed ? (
                <View style={styles.times}>
                  <TimeBox value={h.open} onChange={(v) => setHour(h.day, { open: v })} />
                  <Text muted>–</Text>
                  <TimeBox value={h.close} onChange={(v) => setHour(h.day, { close: v })} />
                </View>
              ) : null}
            </View>
          ))}
          {badHour ? (
            <Text variant="small" color={colors.danger}>
              {badHour.day}: use 24-hour times like 09:00 and 17:30.
            </Text>
          ) : null}
        </Section>

        <Button title="Save shop" size="lg" onPress={() => mut.mutate()} loading={mut.isPending} disabled={!canSave} />
      </View>

      <Sheet visible={picker !== null} onClose={() => setPicker(null)} title={picker === 'state' ? 'Select state' : 'Select category'}>
        <ScrollView style={{ maxHeight: 420 }}>
          {(picker === 'state' ? NIGERIAN_STATES : categories).map((v) => {
            const active = (picker === 'state' ? form.state : form.category) === v;
            return (
              <Pressable
                key={v}
                style={styles.option}
                onPress={() => {
                  set(picker === 'state' ? 'state' : 'category')(v);
                  setPicker(null);
                }}
              >
                <Text color={active ? colors.primary : colors.text} weight={active ? 'semibold' : 'regular'}>{v}</Text>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </ScrollView>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        {icon}
        <Text variant="subheading">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{label}</Text>
        {hint ? <Text variant="small" muted>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} />
    </View>
  );
}

function TimeBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      value={value}
      onChangeText={(v) => {
        // Type 0930 → 09:30
        const d = v.replace(/\D/g, '').slice(0, 4);
        onChange(d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d);
      }}
      keyboardType="number-pad"
      maxLength={5}
      placeholder="09:00"
      placeholderTextColor={colors.mutedLight}
      style={[styles.time, !TIME_RE.test(value) && { borderColor: colors.danger }]}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  cover: { height: 150 },
  coverImg: { width: '100%', height: 150 },
  chip: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  logoRow: { paddingHorizontal: spacing.lg, marginTop: -44 },
  logoEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  body: { padding: spacing.lg, gap: spacing.lg },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    backgroundColor: colors.surface,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  times: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  time: {
    width: 64,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
}));
