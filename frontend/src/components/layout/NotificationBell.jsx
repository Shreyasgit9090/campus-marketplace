import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Star,
  ShieldAlert,
  BellOff,
} from 'lucide-react';
import * as notificationsApi from '../../api/notifications';

const TYPE_META = {
  order_placed: { Icon: ShoppingBag, color: 'text-brand-600 bg-brand-50' },
  reservation_expiring: { Icon: Clock, color: 'text-status-reserved bg-status-reserved/10' },
  item_sold: { Icon: CheckCircle2, color: 'text-status-available bg-status-available/10' },
  new_rating: { Icon: Star, color: 'text-accent-600 bg-accent-50' },
  account_suspended: { Icon: ShieldAlert, color: 'text-red-600 bg-red-50' },
};

// Best-effort link target per notification type — not every type has an
// obvious destination (e.g. new_rating just points at your own profile).
function linkFor(n) {
  if (n.type === 'order_placed' || n.type === 'item_sold') return `/orders/${n.related_id}`;
  if (n.type === 'reservation_expiring') return `/buy/${n.related_id}`;
  if (n.type === 'new_rating') return '/profile';
  return null;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    notificationsApi.listNotifications().then((data) => {
      setNotifications(data.notifications);
      setUnread(data.unread);
    });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 45000);
    return () => clearInterval(interval);
  }, [load]);

  const handleClick = async (n) => {
    if (!n.is_read) {
      await notificationsApi.markRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    const link = linkFor(n);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white card-shadow"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <span className="text-sm font-semibold text-neutral-900">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                    <BellOff className="mb-2 size-6" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] || { Icon: Bell, color: 'text-neutral-500 bg-neutral-100' };
                  const Icon = meta.Icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 ${
                        !n.is_read ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-neutral-800">{n.message}</span>
                        <span className="mt-0.5 block text-xs text-neutral-400">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </span>
                      {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
