import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flag, ChevronRight, PackageSearch } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import Stars from '../components/ui/Stars';
import Badge from '../components/ui/Badge';
import ReportDialog from '../components/ui/ReportDialog';
import { SkeletonLine } from '../components/ui/Skeleton';
import * as usersApi from '../api/users';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [reportTarget, setReportTarget] = useState(null); // { id, name }

  useEffect(() => {
    usersApi.getMe().then(setProfile);
    usersApi.getMyTransactions().then(setTransactions);
  }, []);

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="rounded-3xl bg-white p-6 card-shadow sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white">
              {authUser?.name?.[0]?.toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-neutral-900">{authUser?.name}</h1>
              <p className="text-sm text-neutral-500">{authUser?.email}</p>
              {profile ? (
                <div className="mt-1">
                  <Stars value={profile.avg_rating} count={profile.rating_count} />
                </div>
              ) : (
                <SkeletonLine className="mt-2 w-24" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <h2 className="mb-3 font-display text-lg font-bold text-neutral-900">Transaction history</h2>

      {transactions === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 card-shadow">
              <SkeletonLine className="w-1/3" />
              <SkeletonLine className="mt-2 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {transactions && transactions.bought.length === 0 && transactions.sold.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 card-shadow">
          <PackageSearch className="mb-3 size-10 text-neutral-300" />
          <p className="text-neutral-500">No transactions yet.</p>
        </div>
      )}

      {transactions && (transactions.bought.length > 0 || transactions.sold.length > 0) && (
        <div className="space-y-8">
          {transactions.bought.length > 0 && (
            <TransactionSection
              title="Bought"
              rows={transactions.bought}
              counterpartyKey="seller_name"
              counterpartyIdKey="seller_id"
              onReport={setReportTarget}
            />
          )}
          {transactions.sold.length > 0 && (
            <TransactionSection
              title="Sold"
              rows={transactions.sold}
              counterpartyKey="buyer_name"
              counterpartyIdKey="buyer_id"
              onReport={setReportTarget}
            />
          )}
        </div>
      )}

      <ReportDialog
        open={!!reportTarget}
        reportedUserId={reportTarget?.id}
        reportedUserName={reportTarget?.name}
        onClose={() => setReportTarget(null)}
      />
    </AppLayout>
  );
}

function TransactionSection({ title, rows, counterpartyKey, counterpartyIdKey, onReport }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-2xl bg-white p-4 card-shadow">
            <Link to={`/orders/${row.id}`} className="min-w-0 flex-1">
              <p className="truncate font-semibold text-neutral-900">{row.item_name}</p>
              <p className="text-xs text-neutral-500">
                {row[counterpartyKey]} · ₹{Number(row.item_price).toLocaleString('en-IN')} ·{' '}
                {new Date(row.reserved_at).toLocaleDateString()}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <Badge status={row.status} />
              <button
                onClick={() => onReport({ id: row[counterpartyIdKey], name: row[counterpartyKey] })}
                className="text-neutral-300 hover:text-red-500"
                aria-label={`Report ${row[counterpartyKey]}`}
              >
                <Flag className="size-4" />
              </button>
              <Link to={`/orders/${row.id}`}>
                <ChevronRight className="size-4 text-neutral-300" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
