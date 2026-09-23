import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronDown, LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
  }`;

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link to="/role" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <ShoppingBag className="size-4.5" />
          </span>
          <span className="font-display text-lg font-bold text-neutral-900">Campus Marketplace</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 py-1.5 pl-1.5 pr-3 hover:bg-neutral-50"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium text-neutral-700 sm:inline">{user?.name?.split(' ')[0]}</span>
            <ChevronDown className="size-3.5 text-neutral-400" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 card-shadow"
                >
                  <Link
                    to="/role"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <LayoutGrid className="size-4 text-neutral-400" /> Switch role
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="size-4" /> Log out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
