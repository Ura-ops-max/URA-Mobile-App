import { mapFeedPost } from '@/api/mappers';

describe('mapFeedPost', () => {
  it('takes product photos, name and price from post.product (the feed leaves post.media empty)', () => {
    const post = mapFeedPost({
      _id: 'p1',
      type: 'PRODUCT',
      authorType: 'Business',
      authorId: 'b1',
      displayName: 'Shop',
      media: [],
      product: { _id: 'prod1', name: 'Gas cylinder', price: 16500, stock: 50, media: ['https://cdn/x.jpg'], business: 'b1' },
      createdAt: '2026-10-26T19:43:26.908Z',
    });
    expect(post.media).toEqual(['https://cdn/x.jpg']);
    expect(post.name).toBe('Gas cylinder');
    expect(post.price).toBe(16500);
    expect(post.product?._id).toBe('prod1');
    expect(post.type).toBe('PRODUCT');
  });

  it('keeps a social post’s own media and drops non-URL entries', () => {
    const post = mapFeedPost({ _id: 'p2', type: 'POST', media: ['https://cdn/a.mov', '', 42], createdAt: '2026-01-01' });
    expect(post.media).toEqual(['https://cdn/a.mov']);
    expect(post.product).toBeUndefined();
  });

  it('reads /posts/social productDetails too', () => {
    const post = mapFeedPost({ _id: 'p3', productDetails: { _id: 'x', name: 'Shoes', price: 1000, media: ['https://cdn/s.jpg'] }, createdAt: '2026-01-01' });
    expect(post.type).toBe('PRODUCT');
    expect(post.media).toEqual(['https://cdn/s.jpg']);
  });
});
