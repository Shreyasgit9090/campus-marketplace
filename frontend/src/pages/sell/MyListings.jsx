import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackagePlus, PackageSearch } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import { SkeletonGrid } from '../../components/ui/Skeleton';
import ListingCard from '../../components/sell/ListingCard';
import * as itemsApi from '../../api/items';
import * as ordersApi from '../../api/orders';

export default function MyListings() {
  const [items, setItems] = useState(null);
  const [activeOrderByItem, setActiveOrderByItem] = useState({});

  const load = useCallback(async () => {
    const [myItems, sellingOrders] = await Promise.all([itemsApi.listMyItems(), ordersApi.listSellingOrders()]);
    const map = {};
    for (const order of sellingOrders) {
      if (order.status === 'Reserved') map[order.item_id] = order.id;
    }
    setActiveOrderByItem(map);
    setItems(myItems);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">My Listings</h1>
          <p className="text-sm text-neutral-500">Everything you've listed, across every status.</p>
        </div>
        <Link to="/sell/new">
          <Button fullWidth={false}>
            <PackagePlus className="size-4" /> List an item
          </Button>
        </Link>
      </div>

      {items === null && <SkeletonGrid count={6} />}

      {items?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 card-shadow">
          <PackageSearch className="mb-3 size-10 text-neutral-300" />
          <p className="text-neutral-500">You haven't listed anything yet.</p>
          <Link to="/sell/new" className="mt-4">
            <Button fullWidth={false}>
              <PackagePlus className="size-4" /> List your first item
            </Button>
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <ListingCard key={item.id} item={item} activeOrderId={activeOrderByItem[item.id]} onChanged={load} />
          ))}
        </motion.div>
      )}
    </AppLayout>
  );
}
