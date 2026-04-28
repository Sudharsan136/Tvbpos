const statusConfig = {
  available: {
    border: 'border-[#bbf7d0] hover:border-[#16a34a]',
    bg: 'bg-white',
    dot: 'bg-[#16a34a]',
    numColor: 'text-[#15803d]',
    badge: 'bg-[#dcfce7] text-[#15803d]',
    label: 'Available',
  },
  occupied: {
    border: 'border-[#fde68a] hover:border-[#f59e0b]',
    bg: 'bg-[#fffbeb]',
    dot: 'bg-[#f59e0b] animate-pulse',
    numColor: 'text-[#d97706]',
    badge: 'bg-[#fef9c3] text-[#a16207]',
    label: 'Occupied',
  },
  billed: {
    border: 'border-[#fca5a5] hover:border-[#ef4444]',
    bg: 'bg-[#fff5f5]',
    dot: 'bg-[#ef4444] animate-pulse',
    numColor: 'text-[#dc2626]',
    badge: 'bg-[#fee2e2] text-[#dc2626]',
    label: 'Billed',
  },
};

export default function TableCard({ table, onClick, isActive }) {
  const cfg = statusConfig[table.status] || statusConfig.available;

  return (
    <button
      onClick={() => onClick(table)}
      className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer min-h-[108px] shadow-sm ${cfg.bg} ${cfg.border} ${
        isActive ? 'ring-3 ring-[#16a34a] border-[#16a34a] shadow-lg shadow-[#16a34a]/20 scale-95' : 'hover:shadow-md hover:scale-95'
      }`}
    >
      {/* Status dot */}
      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${cfg.dot}`} />

      {/* Section badge */}
      <div className="absolute top-2.5 left-2.5 text-[9px] text-[#9ca3af] font-bold uppercase leading-none">
        {table.section?.split(' ')[0]}
      </div>

      {/* Table number */}
      <div className={`text-3xl font-extrabold mt-3 ${cfg.numColor}`}>{table.number}</div>

      {/* Table name */}
      <div className="text-[#6b7280] text-xs font-semibold">{table.name}</div>

      {/* Footer */}
      <div className="w-full mt-2 flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
        <span className="text-[#9ca3af] text-[10px] font-medium">{table.capacity}p</span>
      </div>
    </button>
  );
}
