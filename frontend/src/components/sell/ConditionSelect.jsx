import { motion } from 'framer-motion';

const CONDITIONS = [
  { key: 'New', label: 'New', hint: 'Like new, barely used' },
  { key: 'Good', label: 'Good', hint: 'Gently used, minor wear' },
  { key: 'Fair', label: 'Fair', hint: 'Visible wear, fully usable' },
  { key: 'Worn', label: 'Worn', hint: 'Heavily used' },
];

export default function ConditionSelect({ value, onChange }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-neutral-700">Condition</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CONDITIONS.map(({ key, label, hint }) => {
          const active = value === key;
          return (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange(key)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <span className={`block text-sm font-semibold ${active ? 'text-brand-700' : 'text-neutral-800'}`}>
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-tight text-neutral-500">{hint}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
