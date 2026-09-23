import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, type = 'text', className = '', ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && showPassword ? 'text' : type;

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        )}
        <input
          ref={ref}
          type={resolvedType}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900
            placeholder:text-neutral-400 transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600
            ${Icon ? 'pl-9' : ''} ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-red-400' : 'border-neutral-200'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
});

export default Input;
