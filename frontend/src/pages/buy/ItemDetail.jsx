import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, ImageOff, ShoppingBag, User } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Stars from '../../components/ui/Stars';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SkeletonLine } from '../../components/ui/Skeleton';
import * as itemsApi from '../../api/items';
import * as ordersApi from '../../api/orders';
import { useAuth } from '../../context/AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    setItem(null);
    setActiveImage(0);
    itemsApi
      .getItem(id)
      .then(setItem)
      .catch(() => setNotFound(true));
  }, [id]);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const order = await ordersApi.placeOrder(item.id);
      toast.success('Reserved! The seller has been notified.');
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not place order');
      setConfirmOpen(false);
    } finally {
      setPlacing(false);
    }
  };

  if (notFound) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 card-shadow">
          <p className="text-neutral-500">This listing doesn't exist or was removed.</p>
          <Link to="/buy" className="mt-4">
            <Button fullWidth={false}>Back to browsing</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOwnItem = item && user && item.seller_id === user.id;
  const canOrder = item && item.status === 'Available' && !isOwnItem;

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/buy')}
        className="mb-4 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> Browse
      </button>

      {!item ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square w-full" />
          <div className="space-y-3">
            <SkeletonLine className="w-2/3" />
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/2" />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          <div>
            <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-100 card-shadow">
              {item.images.length > 0 ? (
                <img src={item.images[activeImage]} alt={item.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-neutral-300">
                  <ImageOff className="size-12" />
                </div>
              )}
            </div>
            {item.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {item.images.map((src, idx) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(idx)}
                    className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                      idx === activeImage ? 'border-brand-600' : 'border-transparent'
                    }`}
                  >
                    <img src={src} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {item.category === 'Other' ? item.custom_category : item.category}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-neutral-900">{item.name}</h1>
              </div>
              <Badge status={item.status} />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-brand-700">
                ₹{Number(item.final_price).toLocaleString('en-IN')}
              </span>
              <span className="text-neutral-400 line-through">
                ₹{Number(item.original_price).toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-brand-600">
                {Math.round((1 - item.final_price / item.original_price) * 100)}% off
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">Condition: {item.condition_tier}</p>

            {item.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-600">{item.description}</p>
            )}

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4 card-shadow">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <User className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{item.seller_name}</p>
                <Stars value={item.seller_rating} count={item.seller_rating_count} />
              </div>
            </div>

            <div className="mt-6">
              {isOwnItem && <p className="text-sm text-neutral-400">This is your own listing.</p>}
              {!isOwnItem && item.status !== 'Available' && (
                <p className="text-sm text-neutral-400">This item is no longer available.</p>
              )}
              {canOrder && (
                <Button onClick={() => setConfirmOpen(true)}>
                  <ShoppingBag className="size-4" /> Place Order
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Reserve this item?"
        description="It'll be held for you for 48 hours. The seller's contact details are revealed once you confirm."
        confirmLabel="Confirm order"
        loading={placing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handlePlaceOrder}
      />
    </AppLayout>
  );
}
