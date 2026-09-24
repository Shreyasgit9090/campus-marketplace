import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import OtpInput from '../ui/OtpInput';
import Button from '../ui/Button';
import * as authApi from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import useCountdown from '../../hooks/useCountdown';

export default function VerifySignupForm({ email, onNavigate }) {
  const { applySession } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { secondsLeft, start } = useCountdown();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      const { token, user } = await authApi.verifyOtp({ email, code });
      applySession(token, user);
      toast.success('Account verified — welcome to CampusCart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp({ email, purpose: 'signup' });
      toast.success('New code sent');
      start(30);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      <button
        type="button"
        onClick={() => onNavigate('signup')}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="size-3.5" /> Back
      </button>

      <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3 text-brand-800">
        <ShieldCheck className="size-8 shrink-0" />
        <p className="text-sm">
          We sent a 6-digit code to <span className="font-semibold">{email}</span>. It expires in 10 minutes.
        </p>
      </div>

      <OtpInput value={code} onChange={setCode} />

      <Button type="submit" loading={loading}>
        Verify &amp; continue
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
