import { router, Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, Menu, Plus, Search, type LucideIcon } from 'lucide-react-native';
import { useAuthContext } from '@/context/auth-provider';
import { fontFamily, shadow, useTheme, makeStyles } from '@/theme';

/** Icon with a soft pill behind it when the tab is active. */
function TabIcon({ Icon, focused, color }: { Icon: LucideIcon; focused: boolean; color: ColorValue }) {
  const styles = useStyles();
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon size={22} color={String(color)} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isAuthenticated } = useAuthContext();
  const insets = useSafeAreaInsets();
  // Sit above the home indicator / gesture bar, with breathing room on every phone.
  const bottomGap = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 10) + 6;

  // Guests can browse Home and Search; posting and chat ask them to sign in.
  const needsAccount = {
    tabPress: (e: { preventDefault: () => void }) => {
      if (isAuthenticated) return;
      e.preventDefault();
      router.push('/(auth)/login');
    },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 64 + bottomGap,
          paddingTop: 8,
          paddingBottom: bottomGap,
          ...shadow.floating,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 11, marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Search} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        listeners={needsAccount}
        options={{
          title: 'Post',
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: 'Create a post',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.postBtn, focused && styles.postBtnActive]}>
              <Plus size={26} color={colors.white} strokeWidth={2.6} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        listeners={needsAccount}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageCircle} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Menu} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const useStyles = makeStyles((colors) => ({
  iconPill: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.primarySoft },
  postBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    ...shadow.card,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
  },
  postBtnActive: { backgroundColor: colors.primaryDark },
}));
