import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthContext } from '@/context/auth-provider';

const MESSAGE = 'Are you sure you want to logout?';

/** Asks before logging out, then signs out and goes to the sign-in screen. */
export function useConfirmLogout() {
  const { logout } = useAuthContext();

  const doLogout = useCallback(() => {
    logout();
    router.replace('/(auth)/login');
  }, [logout]);

  return useCallback(() => {
    // Alert.alert does nothing on react-native-web (the browser preview).
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(MESSAGE)) doLogout();
      return;
    }
    Alert.alert('Log out', MESSAGE, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: doLogout },
    ]);
  }, [doLogout]);
}
