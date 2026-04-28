import { useEffect, useState } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';
import useSocket from '../hooks/useSocket';
import KotCard from '../components/kds/KotCard';
import api from '../services/api';

export default function Kitchen() {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket('kitchen');

  const fetchKots = async () => {
    try { const res = await api.get('/dashboard/kots'); setKots(res.data); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchKots(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (kot) => setKots((p) => [{ ...kot, _id: kot.kotId, status: 'pending' }, ...p]);
    const handleUpdate = ({ kotId, items, status }) =>
      setKots((p) => p.map((k) => k._id === kotId ? { ...k, items, status } : k));
    socket.on('new_kot', handleNew);
    socket.on('kot_updated', handleUpdate);
    return () => { socket.off('new_kot', handleNew); socket.off('kot_updated', handleUpdate); };
  }, [socket]);

  const handleItemDone = (kotId, itemIndex) => socket?.emit('kot_item_done', { kotId, itemIndex });
  const handleKotComplete = (kotId) => socket?.emit('kot_complete', { kotId });

  const active = kots.filter((k) => k.status !== 'completed');
  const done = kots.filter((k) => k.status === 'completed');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#fef9c3] flex items-center justify-center">
            <ChefHat size={22} className="text-[#d97706]" />
          </div>
          <div>
            <h1 className="text-[#111827] font-extrabold text-2xl">Kitchen Display</h1>
            <p className="text-[#9ca3af] text-sm mt-0.5">{active.length} active KOT{active.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#dcfce7] text-[#15803d] text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" /> Live
          </div>
          <button onClick={fetchKots}
            className="p-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#9ca3af] hover:text-[#16a34a] hover:border-[#bbf7d0] transition shadow-sm">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-2 border-[#16a34a] border-t-transparent rounded-full" />
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#dcfce7] flex items-center justify-center mb-5">
            <ChefHat size={36} className="text-[#16a34a]" />
          </div>
          <p className="text-xl font-extrabold text-[#111827]">Kitchen is clear!</p>
          <p className="text-[#9ca3af] text-sm mt-2 font-medium">No pending KOTs — all good 🍛</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {active.map((kot) => (
            <KotCard key={kot._id} kot={kot} onItemDone={handleItemDone} onKotComplete={handleKotComplete} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p className="text-[#9ca3af] text-sm font-bold uppercase tracking-wider mb-3">Completed ({done.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-50">
            {done.slice(0, 4).map((kot) => <KotCard key={kot._id} kot={kot} />)}
          </div>
        </div>
      )}
    </div>
  );
}
