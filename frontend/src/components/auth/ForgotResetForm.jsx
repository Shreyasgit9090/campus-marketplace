import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft } from 'lucide-react';
import OtpInput from '../ui/OtpInput';
import Input from '../ui/Input';
import Button from '../ui/Button';
import * as authApi from '../../api/auth';
import useCountdown from '../../hooks/useCountdown';

export default function ForgotResetForm({ email, onNavigate }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { secondsLeft, start } = useCountdown();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword: password });
      toast.success('Password reset — log in with your new password');
      onNavigate('login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp({ email, purpose: 'password_reset' });
      toast.success('New code sent');
      start(30);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => onNavigate('forgot-email')}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>

      <p className="text-sm text-neutral-500">
        Enter the code sent to <span className="font-semibold text-neutral-700">{email}</span> and choose a new password.
      </p>

      <OtpInput value={code} onChange={setCode} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="New password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <Button type="submit" loading={loading}>
        Reset password
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Didn't get it?{' '}
        <button
          type="button"
          disabled={secondsLeft > 0 || resending}
          onClick={handleResend}
          className="font-semibold text-brand-700 hover:text-brand-800 disabled:text-neutral-400"
        >
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
        </button>
      </p>
    </form>
  );
}
