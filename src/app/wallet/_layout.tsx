import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/components/HeaderBack';

// The wallet is money only. Orders (confirm, report a problem, claim) live in
// My Orders and Shop Orders — same as the web app.
export default function WalletLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack
      screenOptions={screenOptions}
    >
      <Stack.Screen name="index" options={{ title: 'Wallet' }} />
      <Stack.Screen name="transactions" options={{ title: 'Transaction History' }} />
      <Stack.Screen name="held" options={{ title: 'Held in Buyer-Protected' }} />
      <Stack.Screen name="withdraw" options={{ title: 'Withdraw Funds' }} />
    </Stack>
  );
}
