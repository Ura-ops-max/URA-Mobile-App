import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react-native';
import { Avatar, Button, Input, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { useAuthContext } from '@/context/auth-provider';
import { updateProfile } from '@/api/users';
import { apiErrorMessage, saveShippingAddress } from '@/api/orders';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const { user, refetchAuth } = useAuthContext();
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.profilePicture ?? null);
  const [coverPicture, setCoverPicture] = useState<string | null>(user?.coverPicture ?? null);

  const pick = async (setter: (uri: string) => void, aspect: [number, number]) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Photo permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.7 });
    if (!res.canceled) setter(res.assets[0].uri);
  };

  const [shipPhone, setShipPhone] = useState(user?.shippingAddress?.phone ?? user?.phone ?? '');
  const [shipCity, setShipCity] = useState(user?.shippingAddress?.city ?? '');
  const [shipAddress, setShipAddress] = useState(user?.shippingAddress?.fullAddress ?? '');

  // Same rules as the website's form (first/last ≥ 2 letters, bio ≤ 160).
  const NAME_RE = /^[a-zA-Z\s'-]+$/;
  const nameErr = (v: string, label: string) =>
    v.trim().length < 2 ? `${label} must be at least 2 characters` : !NAME_RE.test(v.trim()) ? `${label} can only contain letters` : undefined;
  const firstErr = nameErr(firstName, 'First name');
  const lastErr = nameErr(lastName, 'Last name');
  const bioErr = bio.length > 160 ? 'Bio cannot exceed 160 characters' : undefined;

  const mut = useMutation({
    mutationFn: () =>
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        // Only send photos that changed (a new local file is uploaded first).
        ...(profilePicture && profilePicture !== user?.profilePicture ? { profilePicture } : {}),
        ...(coverPicture && coverPicture !== user?.coverPicture ? { coverPicture } : {}),
      }),
    onSuccess: async () => {
      await refetchAuth();
      void qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
      router.back();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save your profile. Please try again.')),
  });

  const shipMut = useMutation({
    mutationFn: () => saveShippingAddress({ phone: shipPhone.trim(), city: shipCity.trim(), fullAddress: shipAddress.trim() }),
    onSuccess: async () => {
      await refetchAuth();
      toast.success('Delivery details saved');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save your delivery details.')),
  });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.cover} onPress={() => pick(setCoverPicture, [16, 9])}>
        {coverPicture ? <Image source={{ uri: coverPicture }} style={styles.coverImg} contentFit="cover" /> : <View style={[styles.coverImg, { backgroundColor: colors.primarySoft }]} />}
        <View style={styles.coverEdit}>
          <Camera size={18} color={colors.white} />
          <Text variant="small" color={colors.white}>Change cover</Text>
        </View>
      </Pressable>

      <View style={styles.avatarRow}>
        <Pressable onPress={() => pick(setProfilePicture, [1, 1])}>
          <Avatar uri={profilePicture} name={`${firstName} ${lastName}`} size={90} />
          <View style={styles.avatarEdit}>
            <Camera size={16} color={colors.white} />
          </View>
        </Pressable>
      </View>

      <View style={styles.fields}>
        <View style={styles.row}>
          <Input label="First name" value={firstName} onChangeText={setFirstName} error={firstErr} containerStyle={{ flex: 1 }} />
          <Input label="Last name" value={lastName} onChangeText={setLastName} error={lastErr} containerStyle={{ flex: 1 }} />
        </View>
        <Input label="Username" value={user?.username} editable={false} hint="Your username can't be changed." />
        <Input
          label="Bio"
          placeholder="Tell people about yourself…"
          value={bio}
          onChangeText={setBio}
          multiline
          style={styles.textarea}
          error={bioErr}
          hint={`${bio.length}/160`}
        />
        <Button
          title="Save changes"
          onPress={() => mut.mutate()}
          loading={mut.isPending}
          disabled={!!firstErr || !!lastErr || !!bioErr}
          style={{ marginTop: spacing.sm }}
        />

        {user?.isBusinessOwner ? (
          <Button title="Edit shop" variant="outline" onPress={() => router.push('/settings/business')} />
        ) : (
          <Button title="Switch to a business account" variant="outline" onPress={() => router.push('/become-seller')} />
        )}

        <View style={styles.section}>
          <Text variant="subheading">Delivery details</Text>
          <Text variant="small" muted>
            Used to fill in checkout so buying is one tap.
          </Text>
          <Input label="Phone" value={shipPhone} onChangeText={setShipPhone} keyboardType="phone-pad" placeholder="08012345678" />
          <Input label="City" value={shipCity} onChangeText={setShipCity} />
          <Input label="Address" value={shipAddress} onChangeText={setShipAddress} />
          <Button title="Save delivery details" variant="secondary" onPress={() => shipMut.mutate()} loading={shipMut.isPending} />
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  cover: { height: 140 },
  coverImg: { width: '100%', height: 140 },
  coverEdit: { position: 'absolute', bottom: spacing.sm, right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  avatarRow: { paddingHorizontal: spacing.lg, marginTop: -40, marginBottom: spacing.md },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  fields: { paddingHorizontal: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  section: { marginTop: spacing.lg, gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg },
}));
