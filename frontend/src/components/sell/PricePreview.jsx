import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PricePreview({ originalPrice, finalPrice, loading }) {
  const hasValue = finalPrice != null;
  const discountPct =
    hasValue && originalPrice > 0 ? Math.round((1 - finalPrice / originalPrice) * 100) : null;

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <Sparkles className="size-3.5" /> Buyers will see
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={hasValue ? finalPrice : 'empty'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-display text-3xl font-bold text-brand-900"
          >
            {hasValue ? `₹${Number(finalPrice).toLocaleString('en-IN')}` : loading ? '…' : '₹—'}
          </motion.span>
        </AnimatePresence>
        {discountPct !== null && (
          <span className="text-sm text-neutral-400 line-through">
            ₹{Number(originalPrice).toLocaleString('en-IN')}
          </span>
        )}
        {discountPct !== null && (
          <span className="text-xs font-semibold text-brand-600">{discountPct}% off</span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Computed automatically from the original price and condition — this is read-only.
      </p>
    </div>
  );
}
