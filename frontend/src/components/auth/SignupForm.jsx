import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import * as authApi from '../../api/auth';
import { COLLEGE_EMAIL_DOMAIN } from '../../utils/constants';

export default function SignupForm({ onNavigate, onSignedUp }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = useMemo(
    () => form.email.toLowerCase().endsWith(`@${COLLEGE_EMAIL_DOMAIN}`),
    [form.email]
  );
  const passwordsMatch = form.password === form.confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return toast.error(`Use your @${COLLEGE_EMAIL_DOMAIN} email address`);
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!passwordsMatch) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await authApi.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      toast.success('Verification code sent to your email');
      onSignedUp(form.email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        icon={User}
        placeholder="Ananya Rao"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <div>
        <Input
          label="College email"
          type="email"
          icon={Mail}
          placeholder={`yourname@${COLLEGE_EMAIL_DOMAIN}`}
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          onBlur={() => setTouched(true)}
        />
        {touched && form.email && (
          <div
            className={`mt-1 flex items-center gap-1 text-xs ${emailValid ? 'text-status-available' : 'text-red-500'}`}
          >
            {emailValid ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {emailValid ? 'Valid MSRIT email' : `Must end in @${COLLEGE_EMAIL_DOMAIN}`}
          </div>
        )}
      </div>
      <Input
        label="Phone (for buyers to reach you)"
        type="tel"
        icon={Phone}
        placeholder="+91 98765 43210"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label="Confirm"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          required
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
      </div>

      <Button type="submit" loading={loading}>
        Create account <ArrowRight className="size-4" />
      </Button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Log in
        </button>
      </p>
    </form>
  );
}
