import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/components/HeaderBack';

export default function PublicLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack
      screenOptions={screenOptions}
    >
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="products" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="about" options={{ title: 'About URA' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
      <Stack.Screen name="faq" options={{ title: 'FAQ' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
    </Stack>
  );
}
