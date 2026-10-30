import API from '@/lib/axios-client';
import { uploadImageToS3 } from '@/lib/upload';
import { mapBackendProduct } from '@/api/mappers';
import type { UnifiedPost } from '@/types';

export interface ProductInput {
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  size?: string;
  media: string[];
}

/** Upload any local (file://) media to S3; pass through existing http URLs. */
async function resolveMedia(media: string[]): Promise<string[]> {
  return Promise.all(media.map((m) => (m.startsWith('http') ? Promise.resolve(m) : uploadImageToS3(m, 'products'))));
}

export async function createProduct(input: ProductInput): Promise<UnifiedPost> {
  const media = await resolveMedia(input.media);
  const { data } = await API.post('/products', { ...input, media });
  return mapBackendProduct(data.product ?? data.data ?? data);
}

export async function updateProduct(productId: string, input: Partial<ProductInput>): Promise<UnifiedPost> {
  const media = input.media ? await resolveMedia(input.media) : undefined;
  const { data } = await API.patch(`/products/${productId}`, { ...input, ...(media ? { media } : {}) });
  return mapBackendProduct(data.data ?? data.product ?? data);
}

export async function deleteProduct(productId: string): Promise<void> {
  await API.delete(`/products/${productId}`);
}
