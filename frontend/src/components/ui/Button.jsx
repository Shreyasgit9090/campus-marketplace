import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-brand-700 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-800 disabled:hover:bg-brand-700',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
  outline: 'bg-white text-neutral-800 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = true,
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={disabled || loading ? {} : { scale: 1.015 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5
        font-semibold text-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
