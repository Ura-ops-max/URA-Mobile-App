import API from '@/lib/axios-client';
import type {
  DeliveryMethod,
  DisputeEntry,
  DisputeStatus,
  ListOrder,
  OrderActions,
  OrderDetailResponse,
  PaymentStatus,
  PaymentType,
  StartPaymentResponse,
} from '@/types';

export const NO_ACTIONS: OrderActions = {
  pay: false,
  cancel: false,
  confirmDelivery: false,
  reportProblem: false,
  getRefund: false,
  markReady: false,
  reject: false,
  claimPayment: false,
  respondToProblem: false,
};

export interface CheckoutInput {
  shippingAddress: { fullAddress?: string; city?: string; state?: string; phone: string };
  deliveryFee: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: 'card';
  paymentType: PaymentType;
}

/** POST /orders → { success, message, order:{ _id, orderNumber, totalAmount, status, paymentType } }. */
export async function checkout(input: CheckoutInput): Promise<{
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentType: PaymentType;
}> {
  const { data } = await API.post('/orders', input);
  return data.order;
}

/** My Orders (buyer). GET /orders → { success, orders }. */
export async function getMyOrders(): Promise<ListOrder[]> {
  const { data } = await API.get('/orders');
  return data.orders ?? [];
}

/** Shop Orders (seller): paid orders placed with my shop. GET /orders/received. */
export async function getReceivedOrders(): Promise<ListOrder[]> {
  const { data } = await API.get('/orders/received');
  return data.orders ?? [];
}

/** GET /orders/:id → { order, role, actions, moneyNote }. */
export async function getOrderById(id: string): Promise<OrderDetailResponse> {
  const { data } = await API.get(`/orders/${id}`);
  return {
    order: data.order,
    role: data.role === 'seller' ? 'seller' : 'buyer',
    actions: { ...NO_ACTIONS, ...(data.actions ?? {}) },
    moneyNote: data.moneyNote ?? null,
  };
}

/**
 * Seller marks an order ready. Delivery orders book a rider (no mode);
 * pickup orders send 'pickup' (buyer collects) or 'self_delivery' (shop delivers).
 */
export async function markOrderReady(id: string, mode?: 'pickup' | 'self_delivery') {
  const { data } = await API.post(`/orders/${id}/ready`, mode ? { mode } : {});
  return data.order;
}

// ─── Payment (URA's backend talks to Payluk; the app only opens the widget) ──

export async function startPayment(id: string): Promise<StartPaymentResponse> {
  const { data } = await API.post(`/orders/${id}/pay`);
  return data;
}

export async function getPaymentStatus(id: string): Promise<PaymentStatus> {
  const { data } = await API.get(`/orders/${id}/payment-status`);
  return data;
}

export async function payFromWallet(id: string): Promise<PaymentStatus> {
  const { data } = await API.post(`/orders/${id}/pay-from-wallet`);
  return data;
}

/** Buyer confirms delivery (Buyer-Protected): releases the money to the shop. */
export async function confirmReceived(id: string): Promise<{ status: string; payoutReleased: boolean }> {
  const { data } = await API.post(`/orders/${id}/confirm-received`);
  return data;
}

export interface DisputeFile {
  uri: string;
  name: string;
  mimeType: string;
}

/** Buyer reports a problem / seller responds once. Multipart: message + optional file (image or PDF ≤ 5 MB). */
export async function submitDispute(
  id: string,
  message: string,
  file?: DisputeFile | null,
): Promise<{ disputeStatus: DisputeStatus | null }> {
  const form = new FormData();
  form.append('message', message);
  if (file) form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  const { data } = await API.post(`/orders/${id}/dispute`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getDispute(id: string): Promise<{
  dispute: { status: DisputeStatus; openedAt: string | null; entries: DisputeEntry[] } | null;
}> {
  const { data } = await API.get(`/orders/${id}/dispute`);
  return { dispute: data.dispute ?? null };
}

/** Seller claims Buyer-Protected money one day after the delivery window. */
export async function claimPayment(id: string): Promise<{ payoutReleased: boolean }> {
  const { data } = await API.post(`/orders/${id}/claim`);
  return data;
}

/** Buyer cancels an order that is not paid yet. */
export async function cancelOrder(id: string): Promise<{ status: string }> {
  const { data } = await API.post(`/orders/${id}/cancel`);
  return data;
}

/** Seller can't fill a paid Buyer-Protected order. Stock goes back on sale. */
export async function rejectOrder(id: string, reason?: string): Promise<{ rejected: boolean }> {
  const { data } = await API.post(`/orders/${id}/reject`, reason ? { reason } : {});
  return data;
}

/** Buyer gets their money back after the shop rejected the order. */
export async function requestRefund(id: string): Promise<{ refunded: boolean; pending?: boolean }> {
  const { data } = await API.post(`/orders/${id}/refund`);
  return data;
}

/** Save the buyer's shipping address for next time. PATCH /users/me/shipping. */
export async function saveShippingAddress(input: { phone?: string; state?: string; city?: string; fullAddress?: string }) {
  const { data } = await API.patch('/users/me/shipping', input);
  return data.shippingAddress;
}

/** A readable message from an API error (the backend's own wording). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

/** The backend's error code (e.g. ALREADY_PAID, PAYLUK_PROFILE_REQUIRED). */
export function apiErrorCode(err: unknown): string | undefined {
  const e = err as { response?: { data?: { code?: string } } };
  return e?.response?.data?.code;
}
