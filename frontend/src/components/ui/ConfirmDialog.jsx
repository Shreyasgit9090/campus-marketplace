import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, loading, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 card-shadow"
          >
            <div
              className={`mb-3 flex size-10 items-center justify-center rounded-full ${
                danger ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-700'
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-neutral-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
            <div className="mt-5 flex gap-3">
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                loading={loading}
                className={danger ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : ''}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
