import { motion } from 'framer-motion';
import { Calculator, BookOpen, Shirt, NotebookPen, ShieldCheck, Clock, Handshake, Sparkles } from 'lucide-react';

// Anchored to the four corners with fixed offsets (not percentages) so
// spacing stays constant — and non-overlapping — regardless of pane height,
// instead of drifting together on shorter viewports.
const floatIcons = [
  { Icon: Calculator, position: 'top-16 left-10', delay: 0 },
  { Icon: BookOpen, position: 'bottom-28 left-8', delay: 0.4 },
  { Icon: Shirt, position: 'top-28 right-10', delay: 0.8 },
  { Icon: NotebookPen, position: 'bottom-16 right-14', delay: 1.2 },
];

const features = [
  { Icon: ShieldCheck, text: 'Verified @msrit.edu accounts only' },
  { Icon: Handshake, text: 'Reserve an item, meet on campus, pay in person' },
  { Icon: Clock, text: 'Reservations auto-release after 48 hours' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Hero() {
  return (
    <div className="relative flex min-h-[320px] flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-6 py-16 lg:min-h-screen lg:px-16">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-accent-500/10 blur-3xl" />

      {/* floating category icons — decorative, hidden on small screens to avoid clutter */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {floatIcons.map(({ Icon, position, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.5 + delay },
              scale: { duration: 0.6, delay: 0.5 + delay },
              y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 + delay },
            }}
            className={`absolute flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm ${position}`}
          >
            <Icon className="size-6 text-accent-300" />
          </motion.div>
        ))}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 max-w-lg">
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-300"
        >
          <Sparkles className="size-3.5" />
          Exclusively for MSRIT Students
        </motion.div>

        <motion.h1 variants={item} className="font-display text-4xl font-extrabold leading-tight text-white lg:text-5xl">
          Buy less.
          <br />
          Sell smart.
          <br />
          <span className="text-accent-400">Stay on campus.</span>
        </motion.h1>

        <motion.p variants={item} className="mt-5 max-w-md text-brand-100/90 lg:text-lg">
          Campus Marketplace is where MSRIT students trade textbooks, calculators,
          lab uniforms, and more — peer to peer, at prices that make sense.
        </motion.p>

        <motion.ul variants={item} className="mt-8 space-y-3">
          {features.map(({ Icon, text }, i) => (
            <motion.li
              key={i}
              variants={item}
              className="flex items-center gap-3 text-sm text-brand-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="size-4 text-accent-300" />
              </span>
              {text}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="relative z-10 mt-10 hidden text-xs text-brand-200/60 lg:block"
      >
        Made for MSRIT, by MSRIT.
      </motion.p>
    </div>
  );
}
