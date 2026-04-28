import { Clock, CheckCircle2 } from 'lucide-react';

const statusConfig = {
  pending: { border: 'border-[#fde68a]', bg: 'bg-white', dot: 'bg-[#f59e0b]', badge: 'bg-[#fef9c3] text-[#a16207]', label: 'Pending' },
  'in-progress': { border: 'border-[#93c5fd]', bg: 'bg-white', dot: 'bg-[#3b82f6]', badge: 'bg-[#dbeafe] text-[#1d4ed8]', label: 'Cooking' },
  completed: { border: 'border-[#bbf7d0]', bg: 'bg-[#f0fdf4]', dot: 'bg-[#16a34a]', badge: 'bg-[#dcfce7] text-[#15803d]', label: 'Done' },
};

export default function KotCard({ kot, onItemDone, onKotComplete }) {
  const elapsed = Math.floor((Date.now() - new Date(kot.sentAt)) / 60000);
  const cfg = statusConfig[kot.status] || statusConfig.pending;

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f3f4f6]">
        <div>
          <p className="text-[#111827] font-extrabold text-lg leading-none">Table {kot.tableNumber}</p>
          <p className="text-[#9ca3af] text-xs mt-1 font-semibold">{kot.kotNumber}</p>
        </div>
        <div className="text-right space-y-1.5">
          <div className={`flex items-center gap-1.5 justify-end text-xs font-bold ${elapsed > 15 ? 'text-[#dc2626]' : elapsed > 7 ? 'text-[#f59e0b]' : 'text-[#9ca3af]'}`}>
            <Clock size={11} /> {elapsed}m
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {kot.items.map((item, idx) => (
          <div key={idx}
            className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border ${
              item.status === 'done'
                ? 'opacity-50 bg-[#f9fafb] border-[#e5e7eb]'
                : 'bg-white border-[#e5e7eb] shadow-sm'
            }`}>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${item.status === 'done' ? 'line-through text-[#9ca3af]' : 'text-[#111827]'}`}>
                <span className={`font-extrabold mr-1 ${item.status === 'done' ? 'text-[#9ca3af]' : 'text-[#16a34a]'}`}>{item.qty}×</span>
                {item.name}
              </p>
              {item.notes && <p className="text-[10px] text-[#d97706] mt-0.5 font-medium">📝 {item.notes}</p>}
            </div>
            {item.status !== 'done' && onItemDone ? (
              <button onClick={() => onItemDone(kot._id, idx)}
                className="p-1.5 rounded-lg bg-[#dcfce7] hover:bg-[#16a34a] text-[#16a34a] hover:text-white transition">
                <CheckCircle2 size={15} />
              </button>
            ) : (
              <CheckCircle2 size={15} className="text-[#16a34a] shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Complete button */}
      {kot.status !== 'completed' && onKotComplete && (
        <div className="px-3 pb-3">
          <button onClick={() => onKotComplete(kot._id)}
            className="w-full py-2.5 rounded-xl bg-[#f0fdf4] hover:bg-[#16a34a] border-2 border-[#bbf7d0] hover:border-[#16a34a] text-[#15803d] hover:text-white text-xs font-bold uppercase tracking-wider transition-all">
            ✓ Mark All Done
          </button>
        </div>
      )}
    </div>
  );
}
