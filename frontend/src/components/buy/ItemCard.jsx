import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../ui/Badge';
import SmartImage from '../ui/SmartImage';

export default function ItemCard({ item, className = '' }) {
  const cover = item.images?.[0];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.15 }} className={className}>
      <Link
        to={`/buy/${item.id}`}
        className="group block overflow-hidden rounded-2xl bg-white card-shadow transition-shadow hover:shadow-xl"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <SmartImage
            src={cover}
            alt={item.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.status && item.status !== 'Available' && (
            <div className="absolute left-2 top-2">
              <Badge status={item.status} />
            </div>
          )}
        </div>
        <div className="p-3.5">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{item.name}</h3>
          <p className="truncate text-xs text-neutral-500">
            {item.category === 'Other' ? item.custom_category : item.category} · {item.condition_tier}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-base font-bold text-brand-700">
              ₹{Number(item.final_price).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-neutral-400 line-through">
              ₹{Number(item.original_price).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
