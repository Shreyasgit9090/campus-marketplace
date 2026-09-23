import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

// Client-side gate is UX only — the real enforcement is the requireAdmin
// middleware on every /api/admin/* route. This just stops a non-admin from
// even rendering the page (and firing its data requests) when they type the
// URL directly.
export default function AdminRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return <Spinner fullPage />;
  if (!user) return <Navigate to="/" replace />;
  if (!user.is_admin) return <Navigate to="/role" replace />;

  return children;
}
