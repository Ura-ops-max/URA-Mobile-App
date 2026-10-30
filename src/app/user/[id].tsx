import { ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/ui';
import { ProfileView } from '@/components/ProfileView';
import { useTheme } from '@/theme';
import { getUserProfile } from '@/api/users';
import { useAuthContext } from '@/context/auth-provider';

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const { data, isLoading } = useQuery({ queryKey: ['profile', id], queryFn: () => getUserProfile(id) });

  if (isLoading || !data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }
  return <ProfileView bundle={data} isOwn={user?._id === id} />;
}
