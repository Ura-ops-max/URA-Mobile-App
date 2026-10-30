import { buyerTab, getStatusConfig, itemsSummary, sellerTab } from '@/lib/order-status';

const o = (status: string, extra: { disputeStatus?: string | null; rejectedAt?: string | null } = {}) =>
  ({ status, disputeStatus: null, rejectedAt: null, ...extra }) as Parameters<typeof buyerTab>[0];

describe('order tabs (same rules as the web lib/order-lists)', () => {
  it('puts problems first for buyers', () => {
    expect(buyerTab(o('processing', { disputeStatus: 'open' }))).toBe('problems');
    expect(buyerTab(o('processing', { rejectedAt: '2026-01-01' }))).toBe('problems');
    expect(buyerTab(o('refunded'))).toBe('problems');
    expect(buyerTab(o('delivered'))).toBe('delivered');
    expect(buyerTab(o('pending'))).toBe('active');
    expect(buyerTab(o('shipped'))).toBe('active');
  });

  it('sorts seller orders into new / ready / done / problems', () => {
    expect(sellerTab(o('processing'))).toBe('new');
    expect(sellerTab(o('shipped'))).toBe('ready');
    expect(sellerTab(o('delivered'))).toBe('done');
    expect(sellerTab(o('delivered', { disputeStatus: 'resolved' }))).toBe('problems');
  });
});

describe('getStatusConfig', () => {
  it('words a shipped order by how it reaches the buyer', () => {
    expect(getStatusConfig('shipped', 'delivery').label).toBe('On the way');
    expect(getStatusConfig('shipped', 'pickup').label).toBe('Ready for pickup');
    expect(getStatusConfig('shipped', 'pickup', 'seller_delivery').label).toBe('On the way (by the shop)');
  });

  it('labels the other statuses', () => {
    expect(getStatusConfig('pending').label).toBe('Awaiting payment');
    expect(getStatusConfig('processing').label).toBe('Paid · being prepared');
    expect(getStatusConfig('delivered').tone).toBe('success');
    expect(getStatusConfig('cancelled').tone).toBe('danger');
  });
});

it('summarises items like the web', () => {
  expect(itemsSummary([{ name: 'Shawarma', quantity: 2 }, { name: 'Coke', quantity: 1 }])).toBe('2x Shawarma, 1x Coke');
});
