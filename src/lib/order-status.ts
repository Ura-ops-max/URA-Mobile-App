import type { ListOrder } from '@/types';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info';

/**
 * One place that turns an order's status into words people understand.
 * Ported from the web app's lib/order-status.ts (same wording).
 */
export function getStatusConfig(
  status: string,
  deliveryMethod?: string,
  fulfilment?: string | null,
): { label: string; tone: Tone } {
  switch (status) {
    case 'pending':
      return { label: 'Awaiting payment', tone: 'neutral' };
    case 'processing':
      return { label: 'Paid · being prepared', tone: 'primary' };
    case 'shipped':
      if (fulfilment === 'seller_delivery') return { label: 'On the way (by the shop)', tone: 'info' };
      return deliveryMethod === 'delivery'
        ? { label: 'On the way', tone: 'info' }
        : { label: 'Ready for pickup', tone: 'info' };
    case 'delivered':
      return { label: 'Completed', tone: 'success' };
    case 'cancelled':
      return { label: 'Cancelled', tone: 'danger' };
    case 'refunded':
      return { label: 'Refunded', tone: 'danger' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

// Tab rules for My Orders (buyer) and Shop Orders (seller) — web lib/order-lists.ts.

export type BuyerTab = 'active' | 'delivered' | 'problems';
export type SellerTab = 'new' | 'ready' | 'done' | 'problems';

export const BUYER_TABS: { key: BuyerTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'problems', label: 'Problems' },
];

export const SELLER_TABS: { key: SellerTab; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'ready', label: 'Ready' },
  { key: 'done', label: 'Done' },
  { key: 'problems', label: 'Problems' },
];

type TabFields = Pick<ListOrder, 'status' | 'disputeStatus' | 'rejectedAt'>;

/** A problem: a reported problem, a rejected order, or money sent back. */
const hasProblem = (o: TabFields) => Boolean(o.disputeStatus) || Boolean(o.rejectedAt) || o.status === 'refunded';

export function buyerTab(o: TabFields): BuyerTab {
  if (hasProblem(o)) return 'problems';
  if (o.status === 'delivered') return 'delivered';
  return 'active';
}

export function sellerTab(o: TabFields): SellerTab {
  if (hasProblem(o)) return 'problems';
  if (o.status === 'delivered') return 'done';
  if (o.status === 'shipped') return 'ready';
  return 'new';
}

/** "2x Chicken shawarma, 1x Coke" */
export const itemsSummary = (items: { name: string; quantity: number }[]) =>
  items.map((i) => `${i.quantity}x ${i.name}`).join(', ');

export const NORMAL_PAYMENT_NOTE =
  'Normal Payment goes straight to the seller. For protection, choose Buyer-Protected Payment.';

export const formatAddress = (a?: { fullAddress?: string; city?: string; state?: string }) =>
  [a?.fullAddress, a?.city, a?.state].filter(Boolean).join(', ');
