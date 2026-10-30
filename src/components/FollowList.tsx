import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react-native';
import { Avatar, Button, Input, Text, useToast } from '@/components/ui';
import { spacing, useTheme } from '@/theme';
import { fetchFollowList, toggleFollowUser, type FollowUser } from '@/api/social';
import { apiErrorMessage } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';

interface FollowListProps {
  targetId: string;
  type: 'followers' | 'following';
}

export function FollowList({ targetId, type }: FollowListProps) {
  const { colors } = useTheme();
  const [term, setTerm] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['follow', targetId, type],
    queryFn: () => fetchFollowList(targetId, type),
  });

  const users = (data ?? []).filter((u) => `${u.name} ${u.username}`.toLowerCase().includes(term.toLowerCase()));

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  return (
    <View style={styles.wrap}>
      <Input placeholder={`Search ${type}…`} value={term} onChangeText={setTerm} leftIcon={<Search size={18} color={colors.muted} />} />
      {users.length === 0 ? (
        <View style={styles.empty}>
          <Users size={30} color={colors.mutedLight} />
          <Text muted>No {type} found</Text>
        </View>
      ) : (
        users.map((u) => <FollowRow key={u._id} user={u} />)
      )}
    </View>
  );
}

function FollowRow({ user }: { user: FollowUser }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { user: me, refetchAuth } = useAuthContext();
  const { guard } = useRequireAuth();
  const [following, setFollowing] = useState(user.isFollowing);
  const isMe = !!me && (me._id === user._id || me.business?._id === user._id);
  const mut = useMutation({
    mutationFn: () => toggleFollowUser(user._id, user.isBusiness),
    onSuccess: (r) => {
      setFollowing(r.isFollowing);
      void refetchAuth();
      void qc.invalidateQueries({ queryKey: ['profile'] });
      void qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: (err) => {
      setFollowing((v) => !v);
      toast.error(apiErrorMessage(err, 'Could not update. Please try again.'));
    },
  });
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.rowLeft}
        onPress={() => router.push(user.isBusiness ? `/business/${user._id}` : `/user/${user._id}`)}
      >
        <Avatar uri={user.avatar} name={user.name} size={46} verified={user.isBusiness} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" numberOfLines={1}>{user.name}</Text>
          <Text variant="small" muted numberOfLines={1}>{user.isBusiness ? 'Business' : `@${user.username}`}</Text>
        </View>
      </Pressable>
      {isMe ? null : (
        <Button
          title={following ? 'Following' : 'Follow'}
          size="sm"
          fullWidth={false}
          variant={following ? 'outline' : 'primary'}
          disabled={mut.isPending}
          onPress={guard(() => {
            setFollowing((v) => !v);
            mut.mutate();
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
});
