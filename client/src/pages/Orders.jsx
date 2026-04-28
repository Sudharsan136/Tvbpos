import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
const statusColors = {
  paid: 'bg-[#dcfce7] text-[#15803d]',
  billed: 'bg-[#fef9c3] text-[#a16207]',
  open: 'bg-[#dbeafe] text-[#1d4ed8]',
  cancelled: 'bg-[#fee2e2] text-[#dc2626]',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/orders${params}`).then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = orders.filter((o) =>
    !search || o.billNumber?.toLowerCase().includes(search.toLowerCase()) || o.table?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-[#111827] font-extrabold text-2xl">Orders</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Full billing history</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bill / table..."
            className="pl-9 pr-4 py-2.5 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#111827] text-sm focus:outline-none focus:border-[#16a34a] transition font-medium" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#374151] text-sm focus:outline-none focus:border-[#16a34a] transition font-medium">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="billed">Billed</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#16a34a] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f9fafb] text-[#6b7280] text-xs text-left">
                  {['Bill No.', 'Table', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-3.5 font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-6 py-4 text-[#16a34a] font-bold">{o.billNumber || '—'}</td>
                    <td className="px-6 py-4 text-[#111827] font-semibold">{o.table?.name || '—'}</td>
                    <td className="px-6 py-4 text-[#6b7280]">{o.customer?.name || 'Walk-in'}</td>
                    <td className="px-6 py-4 text-[#6b7280]">{o.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-[#111827] font-bold">{fmt(o.grandTotal)}</td>
                    <td className="px-6 py-4 text-[#6b7280] capitalize font-medium">{o.paymentMode !== 'pending' ? o.paymentMode : '—'}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[o.status]}`}>{o.status}</span></td>
                    <td className="px-6 py-4 text-[#9ca3af] text-xs font-medium">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-16 text-center text-[#9ca3af] font-medium">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
