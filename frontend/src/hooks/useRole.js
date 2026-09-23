import { useLocation } from 'react-router-dom';

// Derived from the current route rather than separate persisted state, so it
// can never drift out of sync with what's actually on screen — including
// right after "Switch role" navigates to a different section.
export default function useRole() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/sell')) return 'sell';
  if (pathname.startsWith('/buy') || pathname.startsWith('/orders')) return 'buy';
  return null;
}
