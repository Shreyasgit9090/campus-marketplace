import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ children }) {
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="group/carousel relative">
      <div ref={trackRef} className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-2">
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full
          border border-neutral-200 bg-white text-neutral-600 opacity-0 shadow-md transition-opacity
          group-hover/carousel:opacity-100 hover:bg-neutral-50 lg:flex"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full
          border border-neutral-200 bg-white text-neutral-600 opacity-0 shadow-md transition-opacity
          group-hover/carousel:opacity-100 hover:bg-neutral-50 lg:flex"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
