import API from '@/lib/axios-client';
import type { DeliveryCost } from '@/types';

/** Fez delivery quote for a destination state. POST /delivery/cost -> { data:{ totalCost } }. */
export async function getDeliveryCost(params: {
  state: string;
  productId?: string;
  businessId?: string;
}): Promise<DeliveryCost> {
  const { data } = await API.post('/delivery/cost', params);
  const d = data.data ?? data;
  return {
    cost: d.cost ?? d.totalCost ?? 0,
    vat: d.vat ?? 0,
    totalCost: d.totalCost ?? d.cost ?? 0,
    state: params.state,
  };
}

export async function trackDelivery(orderNumber: string) {
  const { data } = await API.get(`/delivery/track/${encodeURIComponent(orderNumber)}`);
  return data.data ?? data;
}
