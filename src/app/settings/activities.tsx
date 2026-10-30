import { FlatList, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Smartphone } from 'lucide-react-native';
import { EmptyState, Screen, Text, useToast } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { timeAgo } from '@/lib/format';
import { clearActivityLogs, getActivityLogs } from '@/api/settings';

export default function ActivitiesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['activities'], queryFn: getActivityLogs });

  const clearMut = useMutation({
    mutationFn: clearActivityLogs,
    onSuccess: () => {
      toast.success('Activity log cleared');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  return (
    <Screen padded>
      {(data ?? []).length > 0 ? (
        <View style={styles.head}>
          <Text variant="small" muted>{data?.length} events</Text>
          <Pressable onPress={() => clearMut.mutate()}>
            <Text variant="label" color={colors.danger}>Clear all</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(a) => a._id}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.icon}>
              <Activity size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{item.action}</Text>
              <Text variant="small" muted>{item.detail}</Text>
              {item.device || item.ip || item.location ? (
                <View style={styles.meta}>
                  <Smartphone size={12} color={colors.mutedLight} />
                  <Text variant="small" muted>
                    {[item.device, item.location, item.ip].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="small" muted>{timeAgo(item.createdAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? <EmptyState icon={<Activity size={30} color={colors.primary} />} title="No activity" message="Your account activity will appear here." /> : undefined
        }
      />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'flex-start' },
  icon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
}));
