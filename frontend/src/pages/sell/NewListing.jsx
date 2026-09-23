import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CategorySelect from '../../components/sell/CategorySelect';
import ConditionSelect from '../../components/sell/ConditionSelect';
import ImageDropzone from '../../components/sell/ImageDropzone';
import PricePreview from '../../components/sell/PricePreview';
import * as itemsApi from '../../api/items';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const SELL_NAV = [
  { to: '/sell', label: 'My Listings', end: true },
  { to: '/sell/new', label: 'List an item' },
];

export default function NewListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: 'Textbook',
    customCategory: '',
    name: '',
    description: '',
    originalPrice: '',
    conditionTier: 'Good',
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [finalPrice, setFinalPrice] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const debouncedPrice = useDebouncedValue(form.originalPrice, 350);

  useEffect(() => {
    const price = Number(debouncedPrice);
    if (!price || price <= 0) {
      setFinalPrice(null);
      return;
    }
    setPreviewLoading(true);
    itemsApi
      .previewPrice(price, form.conditionTier)
      .then(setFinalPrice)
      .catch(() => setFinalPrice(null))
      .finally(() => setPreviewLoading(false));
  }, [debouncedPrice, form.conditionTier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Give the item a name');
    if (form.category === 'Other' && !form.customCategory.trim()) {
      return toast.error('Describe what "Other" item this is');
    }
    if (!form.originalPrice || Number(form.originalPrice) <= 0) {
      return toast.error('Enter a valid original price');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      if (form.category === 'Other') fd.append('customCategory', form.customCategory.trim());
      fd.append('name', form.name.trim());
      fd.append('description', form.description);
      fd.append('originalPrice', form.originalPrice);
      fd.append('conditionTier', form.conditionTier);
      images.forEach((file) => fd.append('images', file));

      await itemsApi.createItem(fd);
      toast.success('Listed! Buyers can find it now.');
      navigate('/sell');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout navLinks={SELL_NAV}>
      <button
        onClick={() => navigate('/sell')}
        className="mb-4 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> My Listings
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <PackagePlus className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">List an item</h1>
            <p className="text-sm text-neutral-500">Takes about a minute.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 card-shadow sm:p-8">
          <CategorySelect
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            customValue={form.customCategory}
            onCustomChange={(customCategory) => setForm({ ...form, customCategory })}
          />

          <Input
            label="Item name"
            placeholder="e.g. Casio FX-991ES Plus"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Description</span>
            <textarea
              rows={3}
              placeholder="Any details buyers should know — condition specifics, what's included, etc."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm
                text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none
                focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />
          </label>

          <ImageDropzone files={images} onChange={setImages} />

          <Input
            label="Original price (₹)"
            type="number"
            min="1"
            step="1"
            placeholder="800"
            required
            value={form.originalPrice}
            onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
          />

          <ConditionSelect value={form.conditionTier} onChange={(conditionTier) => setForm({ ...form, conditionTier })} />

          <PricePreview
            originalPrice={Number(form.originalPrice) || 0}
            finalPrice={finalPrice}
            loading={previewLoading}
          />

          <Button type="submit" loading={submitting}>
            List item
          </Button>
        </form>
      </motion.div>
    </AppLayout>
  );
}
