import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Compass, PackageSearch } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { SkeletonGrid, SkeletonCard } from '../../components/ui/Skeleton';
import CategoryFilter from '../../components/buy/CategoryFilter';
import ItemCard from '../../components/buy/ItemCard';
import Carousel from '../../components/buy/Carousel';
import * as itemsApi from '../../api/items';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const PAGE_SIZE = 12;

export default function BuyHome() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [rareItems, setRareItems] = useState(null);

  useEffect(() => {
    itemsApi
      .listItems({ category: 'Other', limit: 10 })
      .then((data) => setRareItems(data.items))
      .catch(() => setRareItems([]));
  }, []);

  useEffect(() => {
    setItems(null);
    setPage(1);
    itemsApi
      .listItems({ search: debouncedSearch || undefined, category: category || undefined, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => setItems([]));
  }, [debouncedSearch, category]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await itemsApi.listItems({
        search: debouncedSearch || undefined,
        category: category || undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...data.items]);
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const showBrowseExtras = !debouncedSearch && !category;
  const hasMore = items && items.length < total;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Browse the marketplace</h1>
        <p className="mt-1 text-sm text-neutral-500">Textbooks, calculators, lab gear, and more — from MSRIT students.</p>

        <div className="mt-5">
          <Input
            icon={Search}
            placeholder="Search for a textbook, calculator, uniform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
      </motion.div>

      {showBrowseExtras && rareItems && rareItems.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-8"
        >
          <div className="mb-3 flex items-center gap-2">
            <Compass className="size-4 text-brand-700" />
            <h2 className="font-display text-lg font-bold text-neutral-900">Try this out</h2>
            <span className="text-xs text-neutral-400">— unusual finds from the "Other" category</span>
          </div>
          <Carousel>
            {rareItems.map((item) => (
              <ItemCard key={item.id} item={item} className="w-48 shrink-0 sm:w-56" />
            ))}
          </Carousel>
        </motion.section>
      )}

      <section className="mt-8">
        {items === null && <SkeletonGrid count={12} />}

        {items?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 card-shadow">
            <PackageSearch className="mb-3 size-10 text-neutral-300" />
            <p className="text-neutral-500">
              {debouncedSearch || category ? 'Nothing matches those filters.' : 'No listings yet — check back soon.'}
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
              {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`more-${i}`} />)}
            </motion.div>

            {hasMore && !loadingMore && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" fullWidth={false} onClick={loadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </AppLayout>
  );
}
