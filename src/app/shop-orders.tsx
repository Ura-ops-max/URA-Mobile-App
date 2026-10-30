// Shop Orders: paid orders customers placed with my shop.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { OrderList } from '@/components/orders/OrderList';
import { SELLER_TABS, sellerTab } from '@/lib/order-status';
import { getReceivedOrders } from '@/api/orders';
import { useAuthContext } from '@/context/auth-provider';

export default function ShopOrdersScreen() {
  const { user } = useAuthContext();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const isSeller = Boolean(user?.isBusinessOwner);
  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['orders', 'received'],
    queryFn: getReceivedOrders,
    enabled: isSeller,
  });

  if (user && !isSeller) return <Redirect href="/orders" />;

  return (
    <OrderList
      subtitle="Paid orders from your customers."
      tabs={SELLER_TABS}
      tabOf={sellerTab}
      orders={data}
      loading={isLoading}
      error={isError}
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      initialTab={tab}
      empty={{
        new: 'No new orders. When a customer pays, the order shows up here.',
        ready: 'Orders you marked ready or on the way show up here.',
        done: 'Delivered orders show up here.',
        problems: 'No problems. Orders with a reported problem, a rejection or a refund show up here.',
      }}
    />
  );
}
