import { ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductForm } from '@/components/ProductForm';
import { Screen, useToast } from '@/components/ui';
import { useTheme } from '@/theme';
import { getSingleProduct } from '@/api/feed';
import { updateProduct } from '@/api/products';

export default function EditProductScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: post, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => getSingleProduct(id) });

  if (isLoading || !post) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  const p = post.product;

  return (
    <ProductForm
      submitLabel="Save changes"
      initial={{
        name: post.name ?? p?.name,
        price: post.price ?? p?.price,
        stock: post.stock ?? p?.stock,
        size: p?.size,
        category: post.category ?? p?.category,
        description: p?.description ?? post.caption,
        media: post.media,
      }}
      onSubmit={async (input) => {
        await updateProduct(p?._id ?? id, input);
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
        await queryClient.invalidateQueries({ queryKey: ['product', id] });
        toast.success('Product updated');
        router.back();
      }}
    />
  );
}
