// My Orders: everything I bought, in Active, Delivered and Problems.
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { OrderList } from '@/components/orders/OrderList';
import { BUYER_TABS, buyerTab } from '@/lib/order-status';
import { getMyOrders } from '@/api/orders';

export default function MyOrdersScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: getMyOrders,
  });
  return (
    <OrderList
      subtitle="Things you bought."
      tabs={BUYER_TABS}
      tabOf={buyerTab}
      orders={data}
      loading={isLoading}
      error={isError}
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      initialTab={tab}
      empty={{
        active: 'No orders on the way. When you buy something, it shows up here.',
        delivered: 'Orders you have received show up here.',
        problems: 'No problems. Orders with a reported problem or a refund show up here.',
      }}
    />
  );
}
