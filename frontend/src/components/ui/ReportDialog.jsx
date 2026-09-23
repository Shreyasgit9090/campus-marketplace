import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';
import * as reportsApi from '../../api/reports';

export default function ReportDialog({ open, reportedUserId, reportedUserName, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return toast.error('Describe what happened');
    setLoading(true);
    try {
      await reportsApi.createReport(reportedUserId, reason.trim());
      toast.success('Report submitted. Our moderators will review it.');
      setReason('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit report');
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
            className="w-full max-w-sm rounded-2xl bg-white p-6 card-shadow"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Flag className="size-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-neutral-900">Report {reportedUserName}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Tell us what happened. Repeated reports may lead to account suspension pending review.
            </p>
            <textarea
              rows={3}
              autoFocus
              placeholder="e.g. Didn't show up for the handover, item didn't match the listing..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />
            <div className="mt-5 flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={submit} loading={loading} className="bg-red-600 hover:bg-red-700 shadow-red-900/20">
                Submit report
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
