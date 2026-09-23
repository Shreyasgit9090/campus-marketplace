import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Phone, ArrowLeft, Clock, Tag } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import * as ordersApi from '../../api/orders';
import { useAuth } from '../../context/AuthContext';

const STATUS_COPY = {
  Reserved: 'Reserved — meet the seller on campus to complete the handover.',
  Completed: 'Completed — hope it worked out!',
  Cancelled: 'This reservation was cancelled.',
  Expired: 'This reservation expired after 48 hours.',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    ordersApi
      .getOrder(id)
      .then(setOrder)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 card-shadow">
          <p className="text-neutral-500">That order doesn't exist, or isn't yours to view.</p>
          <Link to="/orders" className="mt-4">
            <Button fullWidth={false}>My Orders</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button
        onClick={() => navigate('/orders')}
        className="mb-4 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> My Orders
      </button>

      {!order ? (
        <div className="skeleton mx-auto h-96 max-w-lg" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-lg"
        >
          <div className="rounded-3xl bg-white p-6 text-center card-shadow sm:p-8">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                order.status === 'Reserved' ? 'bg-status-reserved/10 text-status-reserved' : 'bg-brand-50 text-brand-700'
              }`}
            >
              <CheckCircle2 className="size-7" />
            </motion.span>

            <h1 className="font-display text-xl font-bold text-neutral-900">{orderTitle(order)}</h1>
            <p className="mt-1 text-sm text-neutral-500">{STATUS_COPY[order.status]}</p>

            <div className="mt-6 space-y-3 rounded-2xl bg-neutral-50 p-4 text-left">
              <Row label="Item" value={order.item_name} />
              <Row label="Condition" value={order.condition_tier} />
              <Row label="Price" value={`₹${Number(order.item_price).toLocaleString('en-IN')}`} />
              <Row label="Status" value={<Badge status={order.status} />} />
              {order.status === 'Reserved' && (
                <Row
                  label="Reserved until"
                  value={
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {new Date(order.expires_at).toLocaleString()}
                    </span>
                  }
                />
              )}
            </div>

            {order.counterpartyPhone && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50 p-4 text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    {user?.id === order.buyer_id ? 'Seller' : 'Buyer'} contact
                  </p>
                  <p className="font-display text-lg font-bold text-brand-900">
                    {user?.id === order.buyer_id ? order.seller_name : order.buyer_name}
                  </p>
                </div>
                <a
                  href={`tel:${order.counterpartyPhone}`}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  <Phone className="size-3.5" /> {order.counterpartyPhone}
                </a>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Tag className="size-3" /> Order #{order.id}
            </div>
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
}

function orderTitle(order) {
  return order.status === 'Reserved' ? 'Order placed!' : 'Order summary';
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
