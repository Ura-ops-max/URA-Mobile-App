import API from '@/lib/axios-client';
import { uploadImageToS3 } from '@/lib/upload';
import type { Comment, UnifiedPost } from '@/types';

export interface CreatePostInput {
  caption: string;
  tags: string[];
  media: string[];
  mediaTypes?: ('image' | 'video')[];
  /** Optional product to attach to a "product post". */
  productId?: string;
}

/** Create a social feed post (type POST). Uploads local media to S3 first. */
export async function createPost(input: CreatePostInput): Promise<UnifiedPost> {
  const uploaded = await Promise.all(
    input.media.map((uri) => (uri.startsWith('http') ? Promise.resolve(uri) : uploadImageToS3(uri, 'attachments'))),
  );
  const { data } = await API.post('/posts', {
    type: 'POST',
    caption: input.caption,
    tags: input.tags,
    media: uploaded,
    productId: input.productId,
  });
  return data.data ?? data;
}

// ─── Comments ──────────────

type Raw = Record<string, any>;

/** A comment from GET /posts/:id/comments (author populated, isLiked, likesCount). */
function mapComment(c: Raw, postId: string): Comment {
  const a = c.author && typeof c.author === 'object' ? c.author : null;
  const isBusiness = c.authorType === 'Business' || !!a?.businessName;
  const likes: string[] = (Array.isArray(c.likes) ? c.likes : []).map((x: unknown) => String(x));
  return {
    _id: String(c._id),
    postId: String(c.postId ?? postId),
    author: {
      _id: a ? String(a._id) : String(c.author ?? ''),
      name: a
        ? isBusiness
          ? String(a.businessName ?? 'Business')
          : `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || a.username || 'URA user'
        : 'You',
      username: a?.username ?? null,
      avatar: (isBusiness ? a?.businessLogo : a?.profilePicture) || null,
    },
    content: String(c.content ?? ''),
    likes,
    isLiked: !!c.isLiked,
    createdAt: c.createdAt,
  };
}

/** GET /posts/:postId/comments → { success, comments } (newest first). */
export async function getComments(postId: string): Promise<Comment[]> {
  const { data } = await API.get(`/posts/${postId}/comments`);
  return (Array.isArray(data?.comments) ? data.comments : []).map((c: Raw) => mapComment(c, postId));
}

/** POST /posts/:postId/comments { content } → { success, comment } (author not populated). */
export async function addComment(postId: string, content: string): Promise<Comment> {
  const { data } = await API.post(`/posts/${postId}/comments`, { content });
  return mapComment(data.comment ?? {}, postId);
}

export async function toggleCommentLike(_postId: string, commentId: string) {
  await API.post(`/posts/comments/${commentId}/like`);
}

/** My own products — used when attaching a product to a post (GET /products/mine). */
export async function getMyProducts(): Promise<UnifiedPost[]> {
  const { data } = await API.get('/products/mine');
  const list = (data.products ?? data.data ?? data) as unknown[];
  const { mapBackendProduct } = await import('@/api/mappers');
  return (Array.isArray(list) ? list : []).map((p) => mapBackendProduct(p as never));
}
