import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Grid3x3, MapPin, MessageCircle, Settings2, Share2 } from 'lucide-react-native';
import { SITE_URL } from '@/constants/config';
import { Avatar, Badge, Button, Rating, Tabs, Text, useToast } from '@/components/ui';
import { ProductGridCard } from '@/components/ProductGridCard';
import { ReviewsSection } from '@/components/ReviewsSection';
import { FollowList } from '@/components/FollowList';
import { AboutTab } from '@/components/AboutTab';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { formatCount } from '@/lib/format';
import { toggleFollowUser } from '@/api/social';
import { accessConversation } from '@/api/chat';
import { setActiveProfile } from '@/lib/active-profile';
import { updateBusiness, updateProfile, type ProfileBundle } from '@/api/users';
import { apiErrorMessage } from '@/api/orders';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthContext } from '@/context/auth-provider';

interface ProfileViewProps {
  bundle: ProfileBundle;
  isOwn?: boolean;
  onEdit?: () => void;
}

export function ProfileView({ bundle, isOwn, onEdit }: ProfileViewProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user, counts, posts } = bundle;
  // A shop page shows the shop; a person's page shows the person (and links to their shop).
  const isBusiness = bundle.kind === 'business';
  const business = isBusiness ? bundle.business : null;
  const linkedShop = isBusiness ? null : bundle.business;
  const [following, setFollowing] = useState(bundle.isFollowing);
  const [followerCount, setFollowerCount] = useState(counts.followers);
  const { user: me, refetchAuth: refetchMe } = useAuthContext();
  const { guard } = useRequireAuth();

  const tabItems = useMemo(
    () =>
      business
        ? [
            { key: 'products', label: 'Products' },
            { key: 'reviews', label: 'Reviews' },
            { key: 'followers', label: 'Followers' },
            { key: 'about', label: 'About' },
          ]
        : [
            { key: 'posts', label: 'Posts' },
            { key: 'followers', label: 'Followers' },
            { key: 'following', label: 'Following' },
            { key: 'about', label: 'About' },
          ],
    [business],
  );
  const [tab, setTab] = useState(tabItems[0].key);

  const toast = useToast();
  const queryClient = useQueryClient();
  const refetchAuth = refetchMe;
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const name = business ? business.businessName : user ? `${user.firstName} ${user.lastName}` : 'User';
  const avatar = localAvatar ?? (business ? business.businessLogo : user?.profilePicture ?? null);
  const cover = business ? business.businessCover : user?.coverPicture;
  const bio = business ? business.about : user?.bio;
  const targetId = business?._id ?? user?._id ?? '';

  const followMut = useMutation({
    mutationFn: () => toggleFollowUser(targetId, isBusiness),
    onSuccess: (r) => {
      setFollowing(r.isFollowing);
      void refetchAuth();
      void queryClient.invalidateQueries({ queryKey: ['follow', targetId] });
    },
    onError: (err) => {
      // Undo the optimistic change (`following` is already the new, failed value).
      setFollowerCount((c) => c + (following ? -1 : 1));
      setFollowing((v) => !v);
      toast.error(apiErrorMessage(err, 'Could not update. Please try again.'));
    },
  });
  const onFollow = guard(() => {
    setFollowerCount((c) => c + (following ? -1 : 1));
    setFollowing((v) => !v);
    followMut.mutate();
  });

  const avatarMut = useMutation({
    mutationFn: async (uri: string) => {
      if (isBusiness) await updateBusiness({ businessLogo: uri });
      else await updateProfile({ profilePicture: uri });
    },
    onSuccess: () => {
      void refetchAuth();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success(isBusiness ? 'Shop logo updated' : 'Profile photo updated');
    },
    onError: () => {
      setLocalAvatar(null);
      toast.error('Could not update photo');
    },
  });

  const changeAvatar = async () => {
    if (!isOwn) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Photo permission needed');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setLocalAvatar(uri); // optimistic
      avatarMut.mutate(uri);
    }
  };

  const products = posts.filter((p) => p.type === 'PRODUCT');
  const socials = posts.filter((p) => p.type === 'POST');

  const onMessage = guard(async () => {
    if (!me) return;
    try {
      // Message from your personal account (switch to your shop's inbox in Messages).
      const sender = { profileId: me._id, model: 'User' as const };
      const conv = business
        ? await accessConversation(business._id, name, avatar, 'Business', sender)
        : await accessConversation(user?._id ?? targetId, name, avatar, 'User', sender);
      setActiveProfile(me._id, 'User');
      router.push(`/chat/${conv._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open the chat.'));
    }
  });
  const isMe = !!me && (me._id === targetId || me.business?._id === targetId);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <View style={styles.cover}>
        {cover ? <Image source={{ uri: cover }} style={styles.coverImg} contentFit="cover" /> : <View style={[styles.coverImg, { backgroundColor: colors.primarySoft }]} />}
      </View>
      <View style={styles.headerBody}>
        <View style={styles.avatarRow}>
          {isOwn ? (
            <Pressable onPress={changeAvatar}>
              <Avatar uri={avatar} name={name} size={84} verified={!!business} />
              <View style={styles.avatarEdit}>
                <Camera size={14} color={colors.white} />
              </View>
            </Pressable>
          ) : (
            <Avatar uri={avatar} name={name} size={84} verified={!!business} />
          )}
          <View style={styles.stats}>
            <Stat label={business ? 'Products' : 'Posts'} value={counts.posts} onPress={() => setTab(business ? 'products' : 'posts')} />
            <Stat label="Followers" value={followerCount} onPress={() => setTab('followers')} />
            <Stat label="Following" value={counts.following} onPress={() => setTab(business ? 'about' : 'following')} />
          </View>
        </View>
        <View style={styles.nameRow}>
          <Text variant="heading">{name}</Text>
          {business?.category ? <Badge label={business.category} tone="primary" /> : null}
        </View>
        {user && !business ? <Text variant="small" muted>@{user.username}</Text> : null}
        {bio ? <Text variant="body" style={styles.bio}>{bio}</Text> : null}
        {business?.address?.fullAddress ? (
          <View style={styles.addrRow}>
            <MapPin size={14} color={colors.muted} />
            <Text variant="small" muted>{business.address.fullAddress}</Text>
          </View>
        ) : null}
        {business ? <Rating value={business.averageRating ?? 0} count={business.totalReviews} size={14} showValue /> : null}

        <View style={styles.actions}>
          {isOwn ? (
            <Button
              title={isBusiness ? 'Edit Shop' : 'Edit Profile'}
              variant="outline"
              leftIcon={<Settings2 size={16} color={colors.text} />}
              onPress={onEdit ?? (() => router.push(isBusiness ? '/settings/business' : '/settings/profile'))}
            />
          ) : isMe ? null : (
            <>
              <Button
                title={following ? 'Following' : 'Follow'}
                variant={following ? 'outline' : 'primary'}
                style={{ flex: 1 }}
                disabled={followMut.isPending}
                onPress={onFollow}
              />
              <Button title="Message" variant="secondary" style={{ flex: 1 }} leftIcon={<MessageCircle size={16} color={colors.primary} />} onPress={onMessage} />
            </>
          )}
        </View>
        {business?.slug ? (
          <Button
            title="Share shop"
            variant="ghost"
            size="sm"
            leftIcon={<Share2 size={16} color={colors.primary} />}
            onPress={() => {
              const url = `${SITE_URL}/${business.slug}`;
              Share.share({ title: business.businessName, message: `${business.businessName} on URA\n${url}`, url }).catch(() => {});
            }}
          />
        ) : null}
      </View>

      <View style={styles.tabs}>
        <Tabs scrollable value={tab} onChange={setTab} items={tabItems} />
      </View>

      {tab === 'products' ? (
        <Grid items={products} />
      ) : tab === 'posts' ? (
        socials.length ? socials.map((p) => <PostRow key={p._id} postId={p._id} caption={p.caption} media={p.media[0]} />) : <Empty label="posts" />
      ) : tab === 'reviews' ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <ReviewsSection itemId={targetId} itemModel="Business" />
        </View>
      ) : tab === 'followers' ? (
        <FollowList targetId={targetId} type="followers" />
      ) : tab === 'following' ? (
        <FollowList targetId={targetId} type="following" />
      ) : (
        <AboutTab user={user} business={business} linkedShop={linkedShop} />
      )}
      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

function Grid({ items }: { items: ProfileBundle['posts'] }) {
  const styles = useStyles();
  if (items.length === 0) return <Empty label="products" />;
  return (
    <View style={styles.grid}>
      {items.map((p) => (
        <View key={p._id} style={styles.gridItem}>
          <ProductGridCard post={p} />
        </View>
      ))}
    </View>
  );
}

function Stat({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable style={styles.stat} onPress={onPress}>
      <Text variant="subheading">{formatCount(value)}</Text>
      <Text variant="small" muted>{label}</Text>
    </Pressable>
  );
}

function PostRow({ postId, caption, media }: { postId: string; caption: string; media?: string }) {
  const styles = useStyles();
  return (
    <Pressable style={styles.postRow} onPress={() => router.push(`/post/${postId}`)}>
      {media ? <Image source={{ uri: media }} style={styles.postThumb} contentFit="cover" /> : null}
      <Text variant="body" numberOfLines={3} style={{ flex: 1 }}>{caption}</Text>
    </Pressable>
  );
}

function Empty({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Grid3x3 size={30} color={colors.mutedLight} />
      <Text muted>No {label} yet</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { paddingBottom: spacing.xxxl },
  cover: { height: 130 },
  coverImg: { width: '100%', height: 130 },
  headerBody: { paddingHorizontal: spacing.lg, marginTop: -34, gap: spacing.sm },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  stats: { flexDirection: 'row', gap: spacing.xl, paddingBottom: spacing.sm },
  stat: { alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  bio: { marginTop: 2 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  tabs: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg },
  gridItem: { width: '47%' },
  postRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  postThumb: { width: 60, height: 60, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xxxl },
}));
