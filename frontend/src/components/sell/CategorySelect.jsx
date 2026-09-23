import { motion } from 'framer-motion';
import { Calculator, Shirt, BookOpen, NotebookPen, ClipboardList, Sparkles } from 'lucide-react';
import Input from '../ui/Input';

const CATEGORY_ICONS = {
  Calculator: Calculator,
  'Lab Uniform': Shirt,
  Textbook: BookOpen,
  Notebook: NotebookPen,
  'Lab Record': ClipboardList,
  Other: Sparkles,
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function CategorySelect({ value, onChange, customValue, onCustomChange }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-neutral-700">Category</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const active = value === cat;
          return (
            <motion.button
              key={cat}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(cat)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                active
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[11px] font-medium leading-tight">{cat}</span>
            </motion.button>
          );
        })}
      </div>

      {value === 'Other' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
          <Input
            placeholder="What is it? (e.g. Drafting kit)"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            required
          />
        </motion.div>
      )}
    </div>
  );
}

export { CATEGORIES };
