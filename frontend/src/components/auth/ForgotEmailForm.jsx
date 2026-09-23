import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import * as authApi from '../../api/auth';

export default function ForgotEmailForm({ onNavigate, onSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('If that account exists, a reset code was sent');
      onSent(email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('login')}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> Back to login
      </button>

      <p className="text-sm text-neutral-500">
        Enter your college email and we'll send you a code to reset your password.
      </p>

      <Input
        label="College email"
        type="email"
        icon={Mail}
        placeholder="yourname@msrit.edu.in"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send reset code <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
