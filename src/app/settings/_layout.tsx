import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/components/HeaderBack';

export default function SettingsLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack
      screenOptions={screenOptions}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="security" options={{ title: 'Password & Security' }} />
      <Stack.Screen name="activities" options={{ title: 'Activity Log' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete Account' }} />
      <Stack.Screen name="business" options={{ title: 'Edit Shop' }} />
    </Stack>
  );
}
