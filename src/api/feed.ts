import API from '@/lib/axios-client';
import { mapBackendProduct, mapFeedPost } from '@/api/mappers';
import type { UnifiedPost } from '@/types';

/** Products per page — same as the web's product feeds. */
export const PRODUCTS_PAGE_SIZE = 15;

/** Fetch a page of products (GET /products) mapped to UnifiedPost. */
async function fetchLiveProducts(page: number, category?: string): Promise<UnifiedPost[]> {
  const params: Record<string, unknown> = { page, limit: PRODUCTS_PAGE_SIZE };
  if (category && category !== 'All') params.category = category;
  const { data } = await API.get('/products', { params });
  const posts = (data?.posts ?? []) as unknown[];
  return posts.map((p) => mapBackendProduct(p as never));
}

/**
 * Home feed — the unified feed (social posts + products), like the web.
 * GET /posts/feed returns items already in UnifiedPost shape.
 */
export async function fetchFeed(page = 1, category?: string): Promise<UnifiedPost[]> {
  // Category filter only applies to products, so use the products endpoint then.
  if (category && category !== 'All') return fetchLiveProducts(page, category);
  const { data } = await API.get('/posts/feed', { params: { page } });
  return ((data?.posts ?? []) as Record<string, unknown>[]).map(mapFeedPost);
}

/** Products-only feed (marketplace). */
export async function fetchProducts(page = 1, category?: string): Promise<UnifiedPost[]> {
  return fetchLiveProducts(page, category);
}


export async function fetchProductCategories(): Promise<string[]> {
  const { data } = await API.get('/products/categories');
  return data.data;
}

export async function deletePost(postId: string): Promise<void> {
  await API.delete(`/posts/${postId}`);
}

export async function getSinglePost(postId: string): Promise<UnifiedPost> {
  const { data } = await API.get(`/posts/${postId}`);
  return mapFeedPost(data.post);
}

export async function getSingleProduct(productId: string): Promise<UnifiedPost> {
  // GET /products/:id -> { success, product, relatedProducts }
  const { data } = await API.get(`/products/${productId}`);
  return mapBackendProduct(data.product ?? data);
}
