import { motion } from 'framer-motion';

export default function Spinner({ fullPage = false }) {
  const dot = (i) => (
    <motion.span
      key={i}
      className="size-2.5 rounded-full bg-brand-600"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
    />
  );

  const content = (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(dot)}
    </div>
  );

  if (!fullPage) return content;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      {content}
    </div>
  );
}
