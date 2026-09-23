import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import VerifySignupForm from './VerifySignupForm';
import ForgotEmailForm from './ForgotEmailForm';
import ForgotResetForm from './ForgotResetForm';

const TITLES = {
  login: ['Welcome back', 'Log in to buy, sell, and manage your listings.'],
  signup: ['Create your account', 'Only verified MSRIT college emails can join.'],
  'verify-signup': ['Verify your email', 'One quick step to activate your account.'],
  'forgot-email': ['Reset your password', "We'll email you a one-time code."],
  'forgot-reset': ['Choose a new password', 'Almost done.'],
};

const isAuthTab = (mode) => mode === 'login' || mode === 'signup';

export default function AuthCard() {
  const [mode, setMode] = useState('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [direction, setDirection] = useState(1);

  const navigate = (next) => {
    setDirection(next === 'login' ? -1 : 1);
    setMode(next);
  };

  const [title, subtitle] = TITLES[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md rounded-3xl bg-white p-8 card-shadow"
    >
      {isAuthTab(mode) && (
        <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-sm font-semibold">
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              onClick={() => navigate(tab)}
              className={`relative z-10 rounded-lg py-2 transition-colors ${
                mode === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'login' ? 'Log in' : 'Sign up'}
              {mode === tab && (
                <motion.span
                  layoutId="auth-tab-pill"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute inset-0 -z-10 rounded-lg bg-brand-700"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={mode}
          custom={direction}
          initial={{ opacity: 0, x: direction * 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <h2 className="font-display text-2xl font-bold text-neutral-900">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-neutral-500">{subtitle}</p>

          {mode === 'login' && <LoginForm onNavigate={navigate} />}
          {mode === 'signup' && (
            <SignupForm
              onNavigate={navigate}
              onSignedUp={(email) => {
                setPendingEmail(email);
                navigate('verify-signup');
              }}
            />
          )}
          {mode === 'verify-signup' && <VerifySignupForm email={pendingEmail} onNavigate={navigate} />}
          {mode === 'forgot-email' && (
            <ForgotEmailForm
              onNavigate={navigate}
              onSent={(email) => {
                setPendingEmail(email);
                navigate('forgot-reset');
              }}
            />
          )}
          {mode === 'forgot-reset' && <ForgotResetForm email={pendingEmail} onNavigate={navigate} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
