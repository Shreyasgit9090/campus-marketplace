import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm({ onNavigate }) {
  const { applySession } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await authApi.login(form);
      applySession(token, user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="College email"
        type="email"
        icon={Mail}
        placeholder="yourname@msrit.edu.in"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Password"
        type="password"
        icon={Lock}
        placeholder="••••••••"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onNavigate('forgot-email')}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Forgot password?
        </button>
      </div>

      <Button type="submit" loading={loading}>
        Log in <ArrowRight className="size-4" />
      </Button>

      <p className="text-center text-sm text-neutral-500">
        New here?{' '}
        <button
          type="button"
          onClick={() => onNavigate('signup')}
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}
