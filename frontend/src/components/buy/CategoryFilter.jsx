import { motion } from 'framer-motion';
import { LayoutGrid, Calculator, Shirt, BookOpen, NotebookPen, ClipboardList, Sparkles } from 'lucide-react';

const OPTIONS = [
  { key: null, label: 'All', Icon: LayoutGrid },
  { key: 'Calculator', label: 'Calculator', Icon: Calculator },
  { key: 'Lab Uniform', label: 'Lab Uniform', Icon: Shirt },
  { key: 'Textbook', label: 'Textbook', Icon: BookOpen },
  { key: 'Notebook', label: 'Notebook', Icon: NotebookPen },
  { key: 'Lab Record', label: 'Lab Record', Icon: ClipboardList },
  { key: 'Other', label: 'Other', Icon: Sparkles },
];

export default function CategoryFilter({ value, onChange }) {
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <motion.button
            key={label}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
