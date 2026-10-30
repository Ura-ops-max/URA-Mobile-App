import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bell, ShoppingCart } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { spacing, useTheme, makeStyles } from '@/theme';
import { Text, IconButton, Avatar } from '@/components/ui';
import { useCartContext } from '@/context/cart-provider';
import { useAuthContext } from '@/context/auth-provider';
import { getUnreadCount } from '@/api/notifications';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showCart?: boolean;
  showBell?: boolean;
  right?: React.ReactNode;
}

export function AppHeader({ title, showLogo, showCart = true, showBell = true, right }: AppHeaderProps) {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const { totalItems } = useCartContext();
  const { user } = useAuthContext();
  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 60000,
  });

  return (
    <View style={styles.header}>
      {showLogo ? (
        // Same "ura." wordmark as the welcome page; its letters are white, so light mode uses a dark-letter copy.
        <Image
          source={
            scheme === 'dark'
              ? require('@/assets/images/ura-wordmark.png')
              : require('@/assets/images/ura-wordmark-dark.png')
          }
          style={styles.logoImg}
          contentFit="contain"
          accessibilityLabel="URA"
        />
      ) : (
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      )}
      <View style={styles.actions}>
        {right}
        {showCart ? (
          <IconButton
            icon={<ShoppingCart size={22} color={colors.text} />}
            onPress={() => router.push('/cart')}
            badgeCount={totalItems}
          />
        ) : null}
        {showBell ? (
          <IconButton
            icon={<Bell size={22} color={colors.text} />}
            onPress={() => router.push('/notifications')}
            badgeCount={unread ?? 0}
          />
        ) : null}
        {user ? (
          <Pressable onPress={() => router.push(`/user/${user._id}`)} hitSlop={4} style={styles.avatarBtn}>
            <Avatar uri={user.profilePicture} name={`${user.firstName} ${user.lastName}`} size={30} verified={user.isBusinessOwner} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  // Wordmark artwork is 2200×565; at 30pt tall the mark stays the size it was.
  logoImg: { width: 117, height: 30 },
  title: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatarBtn: { marginLeft: spacing.xs },
}));
