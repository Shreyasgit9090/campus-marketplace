import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldOff, Eye, CircleSlash, ClipboardList } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonLine } from '../components/ui/Skeleton';
import * as adminApi from '../api/admin';

const TABS = ['Pending', 'Reviewed', 'Dismissed', 'All'];

const STATUS_BADGE = {
  Pending: 'bg-status-reserved/10 text-status-reserved',
  Reviewed: 'bg-status-available/10 text-status-available',
  Dismissed: 'bg-neutral-100 text-neutral-500',
};

export default function Admin() {
  const [tab, setTab] = useState('Pending');
  const [reports, setReports] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'suspend'|'unsuspend', userId, userName }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setReports(null);
    adminApi.listReports(tab === 'All' ? undefined : tab).then(setReports);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (id, status) => {
    try {
      await adminApi.reviewReport(id, status);
      toast.success(`Report marked ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update report');
    }
  };

  const handleSuspendToggle = async () => {
    setBusy(true);
    try {
      if (confirm.type === 'suspend') {
        await adminApi.suspendUser(confirm.userId);
        toast.success(`${confirm.userName} suspended`);
      } else {
        await adminApi.unsuspendUser(confirm.userId);
        toast.success(`${confirm.userName} unsuspended`);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-700 text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Moderation</h1>
          <p className="text-sm text-neutral-500">Review reported users and manage account suspensions.</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-brand-700 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {reports === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 card-shadow">
              <SkeletonLine className="w-1/2" />
              <SkeletonLine className="mt-2 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {reports?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 card-shadow">
          <ClipboardList className="mb-3 size-10 text-neutral-300" />
          <p className="text-neutral-500">No {tab.toLowerCase()} reports.</p>
        </div>
      )}

      {reports && reports.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 card-shadow sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-800">
                    <span className="font-semibold">{r.reporter_name}</span> reported{' '}
                    <span className="font-semibold">{r.reported_name}</span>
                    {!!r.is_suspended && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                        Suspended
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">"{r.reason}"</p>
                  <p className="mt-1 text-xs text-neutral-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[r.status]}`}>
                  {r.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                {r.status === 'Pending' && (
                  <>
                    <Button variant="outline" fullWidth={false} onClick={() => handleReview(r.id, 'Reviewed')}>
                      <Eye className="size-3.5" /> Mark Reviewed
                    </Button>
                    <Button variant="outline" fullWidth={false} onClick={() => handleReview(r.id, 'Dismissed')}>
                      <CircleSlash className="size-3.5" /> Dismiss
                    </Button>
                  </>
                )}
                {r.is_suspended ? (
                  <Button
                    variant="outline"
                    fullWidth={false}
                    onClick={() => setConfirm({ type: 'unsuspend', userId: r.reported_id, userName: r.reported_name })}
                  >
                    <ShieldCheck className="size-3.5" /> Unsuspend {r.reported_name}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    fullWidth={false}
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setConfirm({ type: 'suspend', userId: r.reported_id, userName: r.reported_name })}
                  >
                    <ShieldOff className="size-3.5" /> Suspend {r.reported_name}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'suspend' ? `Suspend ${confirm?.userName}?` : `Unsuspend ${confirm?.userName}?`}
        description={
          confirm?.type === 'suspend'
            ? 'They will be immediately signed out of all sessions and unable to log back in until unsuspended.'
            : 'They will be able to log in again.'
        }
        confirmLabel={confirm?.type === 'suspend' ? 'Suspend' : 'Unsuspend'}
        danger={confirm?.type === 'suspend'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={handleSuspendToggle}
      />
    </AppLayout>
  );
}
