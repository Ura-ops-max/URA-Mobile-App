import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ProductForm } from '@/components/ProductForm';
import { useToast } from '@/components/ui';
import { createProduct } from '@/api/products';

export default function CreateProductScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return (
    <ProductForm
      submitLabel="Publish product"
      onSubmit={async (input) => {
        await createProduct(input);
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
        toast.success('Product published!');
        router.replace('/(tabs)/home');
      }}
    />
  );
}
