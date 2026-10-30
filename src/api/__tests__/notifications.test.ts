import { mapNotification, notificationRoute } from '@/api/notifications';

const base = { modelType: null, relatedId: null, postId: null, title: '' } as const;

describe('notificationRoute', () => {
  it('opens the order for order notices', () => {
    expect(notificationRoute({ ...base, modelType: 'Order', relatedId: 'o1' })).toBe('/order/o1');
  });
  it('opens the right screen for each kind', () => {
    expect(notificationRoute({ ...base, modelType: 'Post', relatedId: 'p1' })).toBe('/post/p1');
    expect(notificationRoute({ ...base, modelType: 'Product', relatedId: 'x' })).toBe('/product/x');
    expect(notificationRoute({ ...base, modelType: 'User', relatedId: 'u1' })).toBe('/user/u1');
    expect(notificationRoute({ ...base, modelType: 'Comment', relatedId: 'c1', postId: 'p9' })).toBe('/post/p9');
  });
  it('handles the server’s special cases', () => {
    expect(notificationRoute({ ...base, title: 'New Message' })).toBe('/(tabs)/chat');
    // Labelled 'Order' by the server but carries the shop id.
    expect(notificationRoute({ ...base, title: 'Welcome Business Owner!', modelType: 'Order', relatedId: 's1' })).toBe('/settings/business');
  });
  it('goes nowhere without a target', () => {
    expect(notificationRoute({ ...base, modelType: 'Order' })).toBeNull();
  });
});

it('maps a populated notification', () => {
  const n = mapNotification({
    _id: 'n1',
    type: 'COMMENT',
    title: 'New Comment',
    message: 'commented on your post',
    isRead: false,
    recipient: 'u1',
    sender: { _id: 's1', firstName: 'Ada', lastName: 'Obi', profilePicture: 'https://cdn/a.jpg' },
    modelType: 'Comment',
    relatedId: { _id: 'c1', postId: 'p1' },
    createdAt: '2026-01-01',
  });
  expect(n.actor?.name).toBe('Ada Obi');
  expect(n.relatedId).toBe('c1');
  expect(n.postId).toBe('p1');
  expect(n.recipientId).toBe('u1');
  expect(n.text).toBe('commented on your post');
});
