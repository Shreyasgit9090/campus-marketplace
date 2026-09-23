import { Star } from 'lucide-react';

export default function Stars({ value = 0, count, size = 'size-3.5' }) {
  const rounded = Math.round(Number(value) * 2) / 2; // nearest half star

  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= rounded;
          const half = !filled && i + 0.5 === rounded;
          return (
            <Star
              key={i}
              className={`${size} ${filled || half ? 'fill-accent-500 text-accent-500' : 'text-neutral-200'}`}
              style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
            />
          );
        })}
      </span>
      {count !== undefined && <span className="text-xs text-neutral-500">({count})</span>}
    </span>
  );
}
