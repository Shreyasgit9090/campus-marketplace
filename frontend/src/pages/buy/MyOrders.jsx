import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageSearch, ChevronRight } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Badge from '../../components/ui/Badge';
import { SkeletonLine } from '../../components/ui/Skeleton';
import * as ordersApi from '../../api/orders';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    ordersApi.listMyOrders().then(setOrders);
  }, []);

  const active = orders?.filter((o) => o.status === 'Reserved') || [];
  const past = orders?.filter((o) => o.status !== 'Reserved') || [];

  return (
    <AppLayout>
      <h1 className="font-display text-2xl font-bold text-neutral-900">My Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">Everything you've reserved or bought.</p>

      {orders === null && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 card-shadow">
              <SkeletonLine className="w-1/3" />
              <SkeletonLine className="mt-2 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-3xl bg-white py-20 card-shadow">
          <PackageSearch className="mb-3 size-10 text-neutral-300" />
          <p className="text-neutral-500">No orders yet — go find something to buy.</p>
          <Link to="/buy" className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Browse listings →
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 space-y-8">
          {active.length > 0 && <OrderSection title="Active" orders={active} />}
          {past.length > 0 && <OrderSection title="Past" orders={past} />}
        </div>
      )}
    </AppLayout>
  );
}

function OrderSection({ title, orders }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 card-shadow transition-shadow hover:shadow-md"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-neutral-900">{order.item_name}</p>
              <p className="text-xs text-neutral-500">
                {order.seller_name} · ₹{Number(order.item_price).toLocaleString('en-IN')} ·{' '}
                {new Date(order.reserved_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={order.status} />
              <ChevronRight className="size-4 text-neutral-300" />
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}
