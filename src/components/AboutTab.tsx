import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Calendar, Clock, Globe, Mail, MapPin, Phone, Store, User } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import type { BusinessType, UserType } from '@/types';

interface AboutTabProps {
  user: UserType | null;
  /** Set on a shop page: the shop itself. */
  business: BusinessType | null;
  /** Set on a person's page: the shop they own, if any. */
  linkedShop?: BusinessType | null;
}

export function AboutTab({ user, business, linkedShop }: AboutTabProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (business) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (
      <View style={styles.wrap}>
        <Section title="THE STORY">
          <Text variant="body" style={styles.story}>{business.about ? `“${business.about}”` : 'No description yet.'}</Text>
        </Section>

        {business.contact?.phone ? (
          <ContactCard icon={<Phone size={18} color={colors.info} />} label="Phone" value={business.contact.phone} onPress={() => Linking.openURL(`tel:${business.contact?.phone}`)} />
        ) : null}
        {business.contact?.email ? (
          <ContactCard icon={<Mail size={18} color={colors.primary} />} label="Email" value={business.contact?.email} onPress={() => Linking.openURL(`mailto:${business.contact?.email}`)} />
        ) : null}
        {business.contact?.website ? (
          <ContactCard icon={<Globe size={18} color={colors.success} />} label="Website" value={business.contact?.website} onPress={() => Linking.openURL(`https://${business.contact?.website?.replace(/^https?:\/\//, '')}`)} />
        ) : null}

        {business.address?.fullAddress ? (
          <Pressable
            style={styles.mapCard}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address?.fullAddress ?? '')}`)}
          >
            <MapPin size={26} color={colors.muted} />
            <Text variant="caption" muted center>{business.address.fullAddress}</Text>
            <Text variant="small" color={colors.primary} weight="semibold">Open in Google Maps</Text>
          </Pressable>
        ) : null}

        <Section title="OPERATING HOURS">
          <View style={{ gap: 4 }}>
            {(business.operatingHours ?? []).map((slot) => {
              const isToday = slot.day === today;
              const closed = slot.open === 'Closed';
              return (
                <View key={slot.day} style={[styles.hourRow, isToday && styles.hourToday]}>
                  <Text variant="label" color={isToday ? colors.primary : colors.muted}>{slot.day}</Text>
                  <Text variant="label" color={closed ? colors.danger : colors.text}>
                    {closed ? 'Closed' : `${slot.open} – ${slot.close}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Section>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.wrap}>
      <Section title={`ABOUT ${user.firstName.toUpperCase()}`}>
        <Text variant="body">{user.bio || 'No bio provided yet.'}</Text>
      </Section>

      {linkedShop?._id ? (
        <Pressable style={styles.bizShortcut} onPress={() => router.push(`/business/${linkedShop._id}`)}>
          <View style={styles.bizIcon}>
            <Store size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" color={colors.white}>Visit {linkedShop.businessName}</Text>
            <Text variant="small" color="#FFE9DE">Official business profile</Text>
          </View>
          <ArrowRight size={20} color={colors.white} />
        </Pressable>
      ) : null}

      <View style={styles.infoRow}>
        <InfoCard icon={<Calendar size={18} color={colors.primary} />} label="Joined" value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
        <InfoCard icon={<Mail size={18} color={colors.primary} />} label="Email" value={user.emailVerified ? 'Verified' : 'Basic'} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="small" muted style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ContactCard({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable style={styles.contact} onPress={onPress}>
      <View style={styles.contactIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text variant="small" muted>{label}</Text>
        <Text variant="bodyMedium" numberOfLines={1}>{value}</Text>
      </View>
    </Pressable>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.infoCard}>
      {icon}
      <View>
        <Text variant="small" muted>{label}</Text>
        <Text variant="bodyMedium">{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { letterSpacing: 1 },
  story: { fontStyle: 'italic', lineHeight: 23 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md },
  contactIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  mapCard: { backgroundColor: colors.surfaceAlt, borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  hourRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, borderRadius: radii.md },
  hourToday: { backgroundColor: colors.primarySoft },
  bizShortcut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.lg },
  bizIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', gap: spacing.md },
  infoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md },
}));
