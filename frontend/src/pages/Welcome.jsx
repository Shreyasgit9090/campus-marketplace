import { motion } from 'framer-motion';
import { PartyPopper, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

// Temporary landing spot after login/signup while role selection + the rest
// of the app are being built. Confirms the auth flow works end to end.
export default function Welcome() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-3xl bg-white p-8 text-center card-shadow"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50">
          <PartyPopper className="size-7 text-brand-700" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-900">Welcome, {user.name.split(' ')[0]}!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          You're logged in as <span className="font-medium text-neutral-700">{user.email}</span>. Role
          selection and the rest of the marketplace are coming next.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" /> Log out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
