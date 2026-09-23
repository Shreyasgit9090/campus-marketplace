import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return <Spinner fullPage />;
  if (!user) return <Navigate to="/" replace />;

  return children;
}
