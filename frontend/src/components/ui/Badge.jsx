const STATUS_STYLES = {
  Available: 'bg-status-available/10 text-status-available',
  Reserved: 'bg-status-reserved/10 text-status-reserved',
  Sold: 'bg-status-sold/10 text-status-sold',
};

export default function Badge({ status, children }) {
  const style = STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {children || status}
    </span>
  );
}
