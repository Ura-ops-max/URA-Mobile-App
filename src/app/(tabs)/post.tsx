import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, Text, useToast } from '@/components/ui';
import { PostComposer } from '@/components/PostComposer';
import { ProductForm } from '@/components/ProductForm';
import { createProduct } from '@/api/products';
import { spacing, makeStyles } from '@/theme';

export default function PostScreen() {
  const styles = useStyles();
  const [mode, setMode] = useState<'product' | 'post'>('post');
  const toast = useToast();
  const queryClient = useQueryClient();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text variant="title">Create</Text>
      </View>
      <View style={styles.toggle}>
        <Tabs
          variant="pill"
          value={mode}
          onChange={(k) => setMode(k as typeof mode)}
          items={[
            { key: 'product', label: 'List Product' },
            { key: 'post', label: 'Make a Post' },
          ]}
        />
      </View>
      {mode === 'product' ? (
        <ProductForm
          submitLabel="Publish product"
          onSubmit={async (input) => {
            await createProduct(input);
            await queryClient.invalidateQueries({ queryKey: ['feed'] });
            toast.success('Product published!');
            router.replace('/(tabs)/home');
          }}
        />
      ) : (
        <PostComposer />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, alignItems: 'flex-start' },
}));
