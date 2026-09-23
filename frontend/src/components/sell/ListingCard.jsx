import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Ban, CheckCircle2, ImageOff, X, Save } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmDialog from '../ui/ConfirmDialog';
import CategorySelect from './CategorySelect';
import ConditionSelect from './ConditionSelect';
import * as itemsApi from '../../api/items';
import * as ordersApi from '../../api/orders';

export default function ListingCard({ item, activeOrderId, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'delete' | 'cancel' | 'sold'
  const [form, setForm] = useState({
    category: item.category,
    customCategory: item.custom_category || '',
    name: item.name,
    description: item.description || '',
    originalPrice: item.original_price,
    conditionTier: item.condition_tier,
  });

  const cover = item.images?.[0];

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const handleSaveEdit = async () => {
    setBusy(true);
    try {
      await itemsApi.updateItem(item.id, {
        category: form.category,
        customCategory: form.category === 'Other' ? form.customCategory : undefined,
        name: form.name,
        description: form.description,
        originalPrice: Number(form.originalPrice),
        conditionTier: form.conditionTier,
      });
      toast.success('Listing updated');
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update listing');
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <motion.div layout className="col-span-full rounded-2xl bg-white p-5 card-shadow sm:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-neutral-900">Edit listing</h3>
          <button onClick={() => setEditing(false)} className="text-neutral-400 hover:text-neutral-600">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4">
          <CategorySelect
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            customValue={form.customCategory}
            onCustomChange={(customCategory) => setForm({ ...form, customCategory })}
          />
          <Input label="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Description</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />
          </label>
          <Input
            label="Original price (₹)"
            type="number"
            value={form.originalPrice}
            onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
          />
          <ConditionSelect value={form.conditionTier} onChange={(conditionTier) => setForm({ ...form, conditionTier })} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={busy}>
              <Save className="size-4" /> Save changes
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div layout className="overflow-hidden rounded-2xl bg-white card-shadow">
        <div className="relative aspect-[4/3] bg-neutral-100">
          {cover ? (
            <img src={cover} alt={item.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-neutral-300">
              <ImageOff className="size-8" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <Badge status={item.status} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="truncate font-semibold text-neutral-900">{item.name}</h3>
          <p className="text-xs text-neutral-500">{item.category === 'Other' ? item.custom_category : item.category}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-brand-700">
              ₹{Number(item.final_price).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-neutral-400 line-through">
              ₹{Number(item.original_price).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.status === 'Available' && (
              <>
                <Button variant="outline" fullWidth={false} className="flex-1" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  fullWidth={false}
                  className="flex-1 text-red-600 hover:bg-red-50"
                  onClick={() => setConfirm('delete')}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </>
            )}
            {item.status === 'Reserved' && (
              <>
                <Button variant="outline" fullWidth={false} className="flex-1" onClick={() => setConfirm('cancel')}>
                  <Ban className="size-3.5" /> Cancel
                </Button>
                <Button fullWidth={false} className="flex-1" onClick={() => setConfirm('sold')}>
                  <CheckCircle2 className="size-3.5" /> Mark Sold
                </Button>
              </>
            )}
            {item.status === 'Sold' && (
              <p className="text-xs text-neutral-400">
                Sold {item.sold_at ? new Date(item.sold_at).toLocaleDateString() : ''}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this listing?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(() => itemsApi.deleteItem(item.id), 'Listing deleted')}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel this reservation?"
        description="The item goes back to Available for other buyers."
        confirmLabel="Cancel reservation"
        danger
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(() => ordersApi.cancelOrder(activeOrderId), 'Reservation cancelled')}
      />
      <ConfirmDialog
        open={confirm === 'sold'}
        title="Mark as sold?"
        description="Confirm only after you've handed the item over and received payment."
        confirmLabel="Mark sold"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => runAction(() => ordersApi.completeOrder(activeOrderId), 'Marked as sold')}
      />
    </>
  );
}
