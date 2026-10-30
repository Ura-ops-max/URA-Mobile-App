import type { UnifiedPost } from '@/types';

/**
 * Backend product shape (from GET /products and GET /products/:id). Items are a
 * flattened Product document plus the fields the controller injects. We map them
 * to the app's `UnifiedPost` so every product component renders unchanged.
 */
interface BackendProduct {
  _id: string;
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
  description?: string;
  size?: string;
  media?: string[];
  createdAt?: string;
  updatedAt?: string;
  business?: { _id?: string; businessName?: string; businessLogo?: string; slug?: string } | string;
  businessSlug?: string;
  likes?: string[];
  averageRating?: number;
  reviewCount?: number;
  totalReviews?: number;
  // controller-injected
  authorId?: string;
  displayName?: string;
  displayAvatar?: string | null;
  isVerified?: boolean;
  isOwner?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  isWishlisted?: boolean;
}

export function mapBackendProduct(p: BackendProduct): UnifiedPost {
  const businessId = typeof p.business === 'string' ? p.business : p.business?._id ?? p.authorId ?? '';
  const media = p.media ?? [];
  return {
    _id: p._id,
    type: 'PRODUCT',
    authorType: 'Business',
    authorId: p.authorId ?? businessId,
    displayName: p.displayName ?? (typeof p.business === 'object' ? p.business?.businessName : undefined) ?? 'Seller',
    displayAvatar: p.displayAvatar ?? (typeof p.business === 'object' ? p.business?.businessLogo : null) ?? null,
    username: null,
    isVerified: !!p.isVerified,
    caption: p.description ?? p.name ?? '',
    media,
    tags: p.category ? [p.category.toLowerCase()] : [],
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
    likesCount: p.likesCount ?? p.likes?.length ?? 0,
    commentsCount: 0,
    isLiked: !!p.isLiked,
    isBookmarked: !!p.isWishlisted,
    rating: p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? p.totalReviews ?? 0,
    isFeatured: false,
    businessSlug: p.businessSlug ?? (typeof p.business === 'object' ? p.business?.slug : undefined),
    product: {
      _id: p._id,
      name: p.name ?? 'Product',
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      category: p.category ?? '',
      description: p.description ?? '',
      size: p.size,
      media,
      business: businessId,
      likes: p.likes ?? [],
      averageRating: p.averageRating,
      reviewCount: p.reviewCount ?? p.totalReviews,
    },
    productName: p.name,
    category: p.category,
    name: p.name,
    price: p.price,
    stock: p.stock,
  };
}

type RawPost = Record<string, any>;

/** First string in a list that is a usable http(s) URL. */
const urls = (v: unknown): string[] =>
  (Array.isArray(v) ? v : []).filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u));

/**
 * A post from the feed endpoints (GET /posts/feed, /posts/social, /posts/:id,
 * /bookmarks/load?type=Post) → UnifiedPost. On PRODUCT posts the backend leaves
 * `post.media` empty and puts the photos, name, price and stock on
 * `post.product` (or `productDetails` on /posts/social), so read them from there.
 */
export function mapFeedPost(p: RawPost): UnifiedPost {
  const prod: RawPost | null =
    (p.product && typeof p.product === 'object' ? p.product : null) ??
    (p.productDetails && typeof p.productDetails === 'object' ? p.productDetails : null);
  const isProduct = p.type === 'PRODUCT' || !!prod;
  const author: RawPost | null = p.author && typeof p.author === 'object' ? p.author : null;
  const ownMedia = urls(p.media);
  const media = ownMedia.length ? ownMedia : urls(prod?.media);
  const isBusiness = p.authorType === 'Business' || !!author?.businessName;
  return {
    _id: String(p._id),
    type: isProduct ? 'PRODUCT' : 'POST',
    authorType: isBusiness ? 'Business' : 'User',
    authorId: String(p.authorId ?? author?._id ?? prod?.business ?? ''),
    displayName:
      String(p.displayName ?? '').trim() ||
      (isBusiness ? author?.businessName : `${author?.firstName ?? ''} ${author?.lastName ?? ''}`.trim()) ||
      'URA user',
    displayAvatar:
      p.displayAvatar ?? (isBusiness ? author?.businessLogo : author?.profilePicture) ?? null,
    username: p.username ?? author?.username ?? null,
    isVerified: !!(p.isVerified ?? author?.isVerified),
    caption: String(p.caption ?? ''),
    media,
    mediaTypes: Array.isArray(p.mediaTypes) && p.mediaTypes.length === media.length ? p.mediaTypes : undefined,
    tags: Array.isArray(p.tags) ? p.tags : [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt ?? p.createdAt,
    likesCount: Number(p.likesCount ?? (Array.isArray(p.likes) ? p.likes.length : 0)) || 0,
    commentsCount: Number(p.commentsCount) || 0,
    isLiked: !!p.isLiked,
    isBookmarked: !!p.isBookmarked,
    rating: Number(p.rating ?? prod?.averageRating) || 0,
    reviewCount: Number(p.reviewCount ?? prod?.totalReviews) || 0,
    isFeatured: !!p.isFeatured,
    businessSlug: p.businessSlug ?? author?.slug ?? undefined,
    product: prod
      ? {
          _id: String(prod._id),
          name: String(prod.name ?? ''),
          price: Number(prod.price) || 0,
          stock: Number(prod.stock) || 0,
          category: String(prod.category ?? ''),
          description: String(prod.description ?? ''),
          size: prod.size || undefined,
          media: urls(prod.media),
          business: String(prod.business?._id ?? prod.business ?? ''),
          likes: Array.isArray(prod.likes) ? prod.likes.map(String) : [],
          averageRating: prod.averageRating,
          reviewCount: prod.totalReviews,
        }
      : undefined,
    productName: prod?.name,
    name: prod?.name,
    price: prod ? Number(prod.price) || 0 : undefined,
    stock: prod ? Number(prod.stock) || 0 : undefined,
    category: prod?.category,
  };
}
