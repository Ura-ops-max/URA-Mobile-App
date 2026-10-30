import API from '@/lib/axios-client';

/** Toggle like on a post or product. */
export async function toggleLikeApi(targetId: string, targetType: 'post' | 'product') {
  const { data } = await API.patch(`/posts/likes/${targetType}/${targetId}`);
  return data;
}

/** Toggle wishlist on a product. */
export async function toggleWishlist(productId: string) {
  const { data } = await API.patch(`/products/wishlist/${productId}`);
  return data;
}

export async function toggleBookmarkApi(targetId: string, targetType: 'Business' | 'Post') {
  const { data } = await API.post(`/users/bookmarks/${targetId}`, { targetType });
  return data;
}

/** POST /users/follow/:targetId { isBusiness } → { message, isFollowing } (toggles). */
export async function toggleFollowUser(targetId: string, isBusiness: boolean): Promise<{ isFollowing: boolean }> {
  const { data } = await API.post(`/users/follow/${targetId}`, { isBusiness });
  return { isFollowing: !!data?.isFollowing };
}

export interface FollowUser {
  _id: string;
  name: string;
  username: string;
  avatar: string | null;
  isBusiness: boolean;
  /** Whether the signed-in person follows them. */
  isFollowing: boolean;
}

export async function fetchFollowList(targetId: string, type: 'followers' | 'following'): Promise<FollowUser[]> {
  const { data } = await API.get(`/users/${targetId}/social`, { params: { type } });
  // Backend: { users: [{ _id, firstName, lastName, username, avatar, isBusiness, isFollowing }] }
  return (data.users ?? []).map((u: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string | null;
    isBusiness?: boolean;
    isFollowing?: boolean;
  }) => ({
    _id: u._id,
    name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'User',
    username: u.username ?? '',
    avatar: u.avatar ?? null,
    isBusiness: !!u.isBusiness,
    isFollowing: !!u.isFollowing,
  }));
}
