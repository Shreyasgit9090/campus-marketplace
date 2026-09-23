import { Navigate } from 'react-router-dom';
import Hero from '../components/landing/Hero';
import AuthCard from '../components/auth/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/role" replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Hero />
      <div className="flex items-center justify-center bg-neutral-50 px-6 py-16 lg:p-12">
        <AuthCard />
      </div>
    </div>
  );
}
