// WhatsApp click-to-chat links (https://wa.me), ported from the web app's
// lib/whatsapp.ts. They only open WhatsApp with the message typed in; the
// person taps Send. No WhatsApp API is used.

/**
 * A Nigerian phone number as WhatsApp wants it: 13 digits starting with 234.
 * Accepts 0803..., +234803... and 234803... (spaces and dashes are fine).
 * Anything else gives null, so no button is shown.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const raw = String(phone ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;
  if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return digits;
  return null;
}

/** https://wa.me/<digits>?text=..., or null when the number is not usable. */
export function whatsAppLink(phone: string | null | undefined, text: string): string | null {
  const n = toWhatsAppNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

/** Buyer to shop: "Hi, I just paid for order ORD-1042: 2x Chicken shawarma." */
export const buyerPaidMessage = (orderNumber: string, itemsText: string) =>
  `Hi, I just paid for order ${orderNumber}: ${itemsText}.`;

/** Seller to buyer, pickup. */
export const sellerReadyMessage = (buyerFirstName: string, orderNumber: string, shopName: string) =>
  `Hi${buyerFirstName ? ` ${buyerFirstName}` : ''}, your order ${orderNumber} from ${shopName} is ready for pickup.`;

/** Seller to buyer, the shop delivers it. */
export const sellerBringingMessage = (buyerFirstName: string, orderNumber: string, shopName: string) =>
  `Hi${buyerFirstName ? ` ${buyerFirstName}` : ''}, I'm bringing your order ${orderNumber} from ${shopName} to you now.`;

export interface OrderMessageInput {
  shopName: string;
  orderNumber: string;
  items: { name: string; quantity: number }[];
  /** What the buyer pays in total, e.g. "₦12,000". */
  totalText: string;
  /** true: the payment went through. false: it failed or was cancelled. */
  paid: boolean;
  /** "Include what I ordered" (on by default). */
  includeItems: boolean;
  deliveryMethod?: string;
  /** The buyer's own address, for delivery orders. */
  address?: string | null;
}

/** The buyer's message to the shop after a payment attempt. */
export function buyerOrderMessage(m: OrderMessageInput): string {
  const what =
    m.includeItems && m.items.length ? `: ${m.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}` : '';
  const start = `Hi ${m.shopName}, I ${m.paid ? 'just paid' : 'tried to pay'} for order ${m.orderNumber}${what}. Total ${m.totalText}.`;
  if (!m.paid) return `${start} My payment did not go through. Can you help?`;
  if (!m.includeItems) return start;
  if (m.deliveryMethod === 'delivery') return m.address ? `${start} My address is ${m.address}.` : start;
  return `${start} I will pick it up.`;
}
