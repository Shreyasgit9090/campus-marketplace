import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';
import * as ratingsApi from '../../api/ratings';

export default function RatingDialog({ open, orderId, revieweeName, onClose, onDone }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (stars === 0) return toast.error('Pick a star rating first');
    setLoading(true);
    try {
      await ratingsApi.createRating(orderId, stars, comment.trim() || undefined);
      toast.success('Rating submitted — thanks!');
      onDone();
    } catch (err) {
      if (err.response?.status === 409) {
        toast('You already rated this order', { icon: '⭐' });
        onDone();
      } else {
        toast.error(err.response?.data?.error || 'Could not submit rating');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center card-shadow"
          >
            <h3 className="font-display text-lg font-bold text-neutral-900">Rate {revieweeName}</h3>
            <p className="mt-1 text-sm text-neutral-500">How did the handover go?</p>

            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(n)}
                  className="p-1"
                >
                  <Star
                    className={`size-8 transition-colors ${
                      n <= (hovered || stars) ? 'fill-accent-500 text-accent-500' : 'text-neutral-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Optional comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />

            <div className="mt-5 flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Skip
              </Button>
              <Button onClick={submit} loading={loading}>
                Submit
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
