import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Tag, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const cards = [
  {
    key: 'buy',
    to: '/buy',
    Icon: ShoppingBag,
    title: 'Buy',
    description: 'Browse textbooks, calculators, lab gear and more listed by fellow MSRIT students.',
  },
  {
    key: 'sell',
    to: '/sell',
    Icon: Tag,
    title: 'Sell',
    description: 'List something you no longer need and set a fair price in seconds.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function RoleSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <p className="text-sm text-neutral-500">Welcome back, {user?.name?.split(' ')[0]}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-neutral-900 lg:text-4xl">
          What are you here to do?
        </h1>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid w-full max-w-3xl gap-6 sm:grid-cols-2"
      >
        {cards.map(({ key, to, Icon, title, description }) => (
          <motion.button
            key={key}
            variants={item}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(to)}
            className="group relative overflow-hidden rounded-3xl bg-white p-8 text-left card-shadow transition-shadow hover:shadow-2xl"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-50 transition-transform duration-300 group-hover:scale-125" />
            <div className="relative">
              <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand-700 text-white">
                <Icon className="size-7" />
              </span>
              <h2 className="font-display text-2xl font-bold text-neutral-900">{title}</h2>
              <p className="mt-2 text-sm text-neutral-500">{description}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Continue <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={logout}
        className="mt-10 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600"
      >
        <LogOut className="size-3.5" /> Log out
      </motion.button>
    </div>
  );
}
