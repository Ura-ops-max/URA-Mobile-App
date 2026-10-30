import API from '@/lib/axios-client';
import { uploadImageToS3 } from '@/lib/upload';
import { mapBackendProduct, mapFeedPost } from '@/api/mappers';
import type { BusinessType, UnifiedPost, UserType } from '@/types';

export interface ProfileBundle {
  /** Which page this is: a person (`user`, with `business` = their shop if any) or a shop (`business`, with `user` = its owner). */
  kind: 'user' | 'business';
  user: UserType | null;
  business: BusinessType | null;
  counts: { posts: number; followers: number; following: number };
  isFollowing: boolean;
  posts: UnifiedPost[];
}

function toBundle(
  data: {
    user?: UserType | null;
    business?: BusinessType | null;
    related?: {
      counts?: { posts: number; products?: number; followers: number; following: number };
      isFollowing?: boolean;
    };
  },
  posts: UnifiedPost[],
  kind: ProfileBundle['kind'],
): ProfileBundle {
  return {
    kind,
    user: data.user ?? null,
    business: data.business ?? null,
    counts: {
      // A shop's first stat is its products (GET /users/business/:id counts.products).
      posts: (kind === 'business' ? data.related?.counts?.products : undefined) ?? data.related?.counts?.posts ?? 0,
      followers: data.related?.counts?.followers ?? 0,
      following: data.related?.counts?.following ?? 0,
    },
    isFollowing: data.related?.isFollowing ?? false,
    posts,
  };
}

/** Someone's own social posts, feed-shaped (GET /posts/social?authorId&restrict=true), like the web. */
async function socialPostsBy(authorId: string): Promise<UnifiedPost[]> {
  try {
    const { data } = await API.get('/posts/social', { params: { authorId, restrict: true, page: 1, limit: 15 } });
    return ((data?.posts ?? []) as Record<string, unknown>[]).map(mapFeedPost).filter((p) => p.type === 'POST');
  } catch {
    return [];
  }
}

/** A shop's products (GET /products?businessId&restrict=true), like the web storefront. */
async function productsOf(businessId: string): Promise<UnifiedPost[]> {
  try {
    const { data } = await API.get('/products', { params: { businessId, restrict: true, page: 1, limit: 15 } });
    return ((data?.posts ?? []) as unknown[]).map((p) => mapBackendProduct(p as never));
  } catch {
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<ProfileBundle> {
  const [{ data }, posts] = await Promise.all([API.get(`/users/${userId}`), socialPostsBy(userId)]);
  return toBundle(data, posts, 'user');
}

export async function getBusinessProfile(businessId: string): Promise<ProfileBundle> {
  const [{ data }, products] = await Promise.all([API.get(`/users/business/${businessId}`), productsOf(businessId)]);
  const ownerId = data?.user?._id ?? data?.business?.owner;
  const posts = ownerId ? await socialPostsBy(String(ownerId)) : [];
  return toBundle(data, [...products, ...posts], 'business');
}

/** Upload a local (file://) image to S3; pass through existing http URLs / null. */
async function resolveImage(value: string | null | undefined, folder: string): Promise<string | null | undefined> {
  if (value == null) return value;
  if (value.startsWith('http')) return value;
  return uploadImageToS3(value, folder);
}

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string | null;
  coverPicture?: string | null;
}): Promise<UserType> {
  const payload = { ...input };
  if (input.profilePicture !== undefined) payload.profilePicture = await resolveImage(input.profilePicture, 'profiles');
  if (input.coverPicture !== undefined) payload.coverPicture = await resolveImage(input.coverPicture, 'profiles');
  const { data } = await API.patch('/users/me/profile', payload);
  return data.user ?? data.data ?? data;
}

export interface BecomeSellerInput {
  businessName: string;
  category: string;
  about: string;
  phone: string;
  city: string;
  state: string;
  street: string;
  businessLogo?: string | null;
}

/**
 * PATCH /users/me/business takes FLAT fields (validators/user.validators.ts
 * userBusinessFields); any other key is rejected with 400.
 */
export interface BusinessUpdateInput {
  businessName?: string;
  category?: string;
  about?: string;
  phone?: string;
  website?: string;
  email?: string;
  fullAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  hasPhysicalStore?: boolean;
  showStreetAddress?: boolean;
  showOnGoogle?: boolean;
  businessLogo?: string | null;
  businessCover?: string | null;
  operatingHours?: { day: string; open: string; close: string }[];
}

/** Convert a regular user into a business owner, then fill in the details. */
export async function becomeSeller(input: BecomeSellerInput): Promise<BusinessType> {
  try {
    // Creates the shop with placeholder details and flips isBusinessOwner.
    await API.post('/users/me/convert-to-business');
  } catch (err) {
    // A retry after the details step failed: the account is already a business.
    const msg = String((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '');
    if (!/already a business/i.test(msg)) throw err;
  }
  await updateBusiness({
    businessName: input.businessName,
    about: input.about,
    category: input.category,
    phone: input.phone,
    street: input.street,
    city: input.city,
    state: input.state,
    country: 'Nigeria',
    fullAddress: [input.street, input.city, input.state].filter(Boolean).join(', '),
    ...(input.businessLogo ? { businessLogo: input.businessLogo } : {}),
  });
  // /users/me has no `business` field: the new shop is related.businesses[0].
  const { data } = await API.get('/users/me');
  return (data?.related?.businesses?.[0] ?? null) as BusinessType;
}

export async function updateBusiness(input: BusinessUpdateInput): Promise<BusinessType | null> {
  const payload: BusinessUpdateInput = { ...input };
  if (input.businessLogo !== undefined) payload.businessLogo = await resolveImage(input.businessLogo, 'business');
  if (input.businessCover !== undefined) payload.businessCover = await resolveImage(input.businessCover, 'business');
  const { data } = await API.patch('/users/me/business', payload);
  return data.business ?? data.data ?? null;
}

/** A shop's opening hours (for "shop is closed" at checkout). GET /users/business/:id. */
export async function getBusinessHours(
  businessId: string,
): Promise<{ businessName?: string; operatingHours?: { day?: string; open?: string; close?: string; isClosed?: boolean }[] }> {
  const { data } = await API.get(`/users/business/${businessId}`);
  return { businessName: data.business?.businessName, operatingHours: data.business?.operatingHours };
}
