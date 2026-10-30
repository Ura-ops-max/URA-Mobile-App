import API from '@/lib/axios-client';
import { mapBackendProduct } from '@/api/mappers';
import type { SearchResults, UnifiedPost } from '@/types';

export interface SearchParams {
  q: string;
  type?: 'all' | 'business' | 'user' | 'product' | 'post';
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export async function globalSearch(params: SearchParams): Promise<SearchResults> {
  const { data } = await API.get('/search', { params });
  const root = (data.data ?? data) as { businesses?: unknown[]; products?: unknown[] };
  return {
    businesses: (root.businesses ?? []) as SearchResults['businesses'],
    products: ((root.products ?? []) as unknown[]).map((p) => mapBackendProduct(p as never)),
  };
}

/** Visual/image search — presign upload then POST /products/image-search { imageUrl }. */
export async function imageSearch(uri: string): Promise<UnifiedPost[]> {
  const { uploadImageToS3 } = await import('@/lib/upload');
  const imageUrl = await uploadImageToS3(uri, 'search');
  const { data } = await API.post('/products/image-search', { imageUrl });
  const list = (data.products ?? data.data ?? []) as unknown[];
  return (Array.isArray(list) ? list : []).map((p) => mapBackendProduct(p as never));
}

export async function getRecentSearches(): Promise<{ _id: string; query: string }[]> {
  const { data } = await API.get('/search/recent');
  return data.data ?? data;
}

export async function saveSearch(query: string) {
  await API.post('/search/history', { query });
}

export async function deleteSearch(id: string) {
  await API.delete(`/search/history/${id}`);
}

export async function clearSearchHistory() {
  await API.delete('/search/history');
}
