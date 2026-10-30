import API from '@/lib/axios-client';
import type { Review, ReviewsData, ReviewSummary } from '@/types';

type Raw = Record<string, any>;

const idOf = (v: unknown) => (v && typeof v === 'object' ? String((v as Raw)._id ?? '') : String(v ?? ''));

function mapReview(r: Raw, viewerId?: string | null): Review {
  const u = r.user && typeof r.user === 'object' ? r.user : null;
  const likes: string[] = (Array.isArray(r.likes) ? r.likes : []).map(idOf);
  const dislikes: string[] = (Array.isArray(r.dislikes) ? r.dislikes : []).map(idOf);
  return {
    _id: String(r._id),
    reviewedItem: idOf(r.reviewedItem),
    reviewedItemModel: r.reviewedItemModel === 'Business' ? 'Business' : 'Product',
    author: {
      _id: u ? String(u._id) : idOf(r.user),
      name: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username || 'URA user' : 'URA user',
      avatar: u?.profilePicture || null,
    },
    rating: Number(r.rating) || 0,
    comment: String(r.comment ?? ''),
    likes,
    dislikes,
    isLiked: !!viewerId && likes.includes(viewerId),
    isDisliked: !!viewerId && dislikes.includes(viewerId),
    createdAt: r.createdAt,
  };
}

/** The summary is worked out here, like the web app does. */
function summarise(reviews: Review[]): ReviewSummary {
  const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star]++;
    sum += r.rating;
  }
  return {
    averageRating: reviews.length ? sum / reviews.length : 0,
    totalReviews: reviews.length,
    distribution,
  };
}

/** GET /reviews/item/:id → { status, results, data: Review[] (user populated) }. Public. */
export async function getItemReviews(itemId: string, viewerId?: string | null): Promise<ReviewsData> {
  const { data } = await API.get(`/reviews/item/${itemId}`);
  const rows: Raw[] = Array.isArray(data?.data) ? data.data : [];
  const reviews = rows.map((r) => mapReview(r, viewerId));
  return { summary: summarise(reviews), reviews };
}

export async function createReview(input: {
  reviewedItem: string;
  reviewedItemModel: 'Business' | 'Product';
  rating: number;
  comment?: string;
}) {
  const { data } = await API.post('/reviews', input);
  return data.data;
}

export async function updateReview(id: string, input: { rating?: number; comment?: string }) {
  const { data } = await API.patch(`/reviews/${id}`, input);
  return data;
}

export async function deleteReview(id: string) {
  await API.delete(`/reviews/${id}`);
  return { success: true };
}

export async function likeReview(id: string) {
  const { data } = await API.post(`/reviews/${id}/like`);
  return data;
}

export async function dislikeReview(id: string) {
  const { data } = await API.post(`/reviews/${id}/dislike`);
  return data;
}
