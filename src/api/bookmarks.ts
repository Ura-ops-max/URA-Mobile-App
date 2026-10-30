import API from '@/lib/axios-client';
import { mapFeedPost } from '@/api/mappers';
import type { BookmarkBusiness, UnifiedPost } from '@/types';

/** GET /bookmarks/load?type=Business → a raw array of business documents. */
export async function fetchBookmarkedBusinesses(): Promise<BookmarkBusiness[]> {
  const { data } = await API.get('/bookmarks/load', { params: { type: 'Business' } });
  const list = (Array.isArray(data) ? data : (data?.data ?? [])) as Record<string, unknown>[];
  return (Array.isArray(list) ? list : []).map((b) => ({
    _id: b._id as string,
    businessName: (b.businessName as string) ?? 'Business',
    businessLogo: (b.businessLogo as string) ?? '',
    category: (b.category as string) ?? '',
    averageRating: (b.averageRating as number) ?? 0,
    totalReviews: (b.totalReviews as number) ?? 0,
    address: ((b.address as { fullAddress?: string })?.fullAddress) ?? (b.address as string) ?? '',
    about: (b.about as string) ?? '',
  }));
}

/**
 * GET /bookmarks/load?type=Post → a raw array of posts already in feed shape
 * (type, authorId, displayName, displayAvatar, likesCount, isLiked...), with
 * `product` populated as the full product document.
 */
export async function fetchBookmarkedPosts(): Promise<UnifiedPost[]> {
  const { data } = await API.get('/bookmarks/load', { params: { type: 'Post' } });
  const list = (Array.isArray(data) ? data : (data?.data ?? [])) as Record<string, unknown>[];
  return list.map((p) => ({ ...mapFeedPost(p), isBookmarked: true }));
}
