import { useQuery } from '@tanstack/react-query';
import { getBusinessHours } from '@/api/users';
import { shopOpenState } from '@/lib/opening-hours';

/** Whether the cart's shop is open now (checkout is blocked while it's closed, as on the web). */
export function useShopOpen(businessId?: string | null) {
  const { data } = useQuery({
    queryKey: ['shop-hours', businessId],
    queryFn: () => getBusinessHours(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
  });
  return { ...shopOpenState(data?.operatingHours), businessName: data?.businessName };
}
