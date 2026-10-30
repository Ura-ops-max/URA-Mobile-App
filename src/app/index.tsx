import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthContext } from '@/context/auth-provider';
import { Preloader } from '@/components/Preloader';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/(tabs)/home' : '/(public)/landing');
  }, [isAuthenticated, isLoading]);

  return <Preloader />;
}
