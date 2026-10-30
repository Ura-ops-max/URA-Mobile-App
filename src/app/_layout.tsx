import { useEffect, useState, type ReactNode } from 'react';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { Appearance, Pressable, Text as RNText, View } from 'react-native';
import { useStackScreenOptions } from '@/components/HeaderBack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { QueryProvider } from '@/context/query-provider';
import { AuthProvider } from '@/context/auth-provider';
import { CartProvider } from '@/context/cart-provider';
import { RealtimeProvider } from '@/context/realtime-provider';
import { ToastProvider } from '@/components/ui';
import { Preloader } from '@/components/Preloader';
import { loadThemePreference, ThemeProvider } from '@/context/theme-provider';
import { darkColors, lightColors, useTheme, type ThemePreference } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // The saved Light / Dark / System choice, read before the first frame so the
  // app never flashes the wrong theme.
  const [themePref, setThemePref] = useState<ThemePreference | null>(null);
  useEffect(() => {
    void loadThemePreference().then(setThemePref);
  }, []);

  const ready = fontsLoaded && themePref !== null;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <Preloader />;

  return (
    <ThemeProvider initialPreference={themePref}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
              <RealtimeProvider>
                <ThemedStatusBar />
                <ThemedStack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(public)" options={{ headerShown: false }} />
                  <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
                  <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
                  <Stack.Screen name="user/[id]" options={{ title: 'Profile' }} />
                  <Stack.Screen name="business/[id]" options={{ title: 'Store' }} />
                  <Stack.Screen name="cart" options={{ title: 'Cart' }} />
                  <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
                  <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
                  <Stack.Screen name="shop-orders" options={{ title: 'Shop Orders' }} />
                  <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
                  <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
                  <Stack.Screen name="deals" options={{ title: 'Deals & Offers' }} />
                  <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
                  <Stack.Screen name="image-search" options={{ title: 'AI Search' }} />
                  <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                  <Stack.Screen name="create-product" options={{ title: 'New Product', presentation: 'modal' }} />
                  <Stack.Screen name="edit-product/[id]" options={{ title: 'Edit Product', presentation: 'modal' }} />
                  <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
                  <Stack.Screen name="chat/new" options={{ title: 'New Message', presentation: 'modal' }} />
                  <Stack.Screen name="menu" options={{ title: 'Menu' }} />
                  <Stack.Screen name="become-seller" options={{ title: 'Become a Seller' }} />
                  <Stack.Screen name="payluk-setup" options={{ title: 'Payment Setup' }} />
                  <Stack.Screen name="payment-complete" options={{ title: 'Payment' }} />
                  <Stack.Screen name="wallet" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} />
                </ThemedStack>
              </RealtimeProvider>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ThemeProvider>
  );
}

/** Light status bar text in dark mode, dark text in light mode. */
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function ThemedStack({ children }: { children: ReactNode }) {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions}>{children}</Stack>;
}

/**
 * Last-resort screen if a screen throws while rendering, instead of a blank or
 * closed app. Plain components only: it may render outside the providers.
 * The error itself is not shown to people (it can contain internal details).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  if (__DEV__) console.error('[ErrorBoundary]', error);
  const dark = Appearance.getColorScheme() === 'dark';
  const palette = dark ? darkColors : lightColors;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: palette.background }}>
      <RNText style={{ fontSize: 20, fontWeight: '700', color: palette.text, textAlign: 'center' }}>Something went wrong</RNText>
      <RNText style={{ fontSize: 15, color: palette.muted, textAlign: 'center' }}>
        Please try again. If it keeps happening, contact URA support.
      </RNText>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={{ marginTop: 8, backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
      >
        <RNText style={{ color: palette.white, fontSize: 15, fontWeight: '600' }}>Try again</RNText>
      </Pressable>
    </View>
  );
}
