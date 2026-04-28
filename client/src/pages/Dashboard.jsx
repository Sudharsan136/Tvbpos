import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, IndianRupee, RefreshCw, ArrowUpRight } from 'lucide-react';
import api from '../services/api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const statusColors = {
  paid: 'bg-[#dcfce7] text-[#15803d]',
  billed: 'bg-[#fef9c3] text-[#a16207]',
  open: 'bg-[#dbeafe] text-[#1d4ed8]',
  cancelled: 'bg-[#fee2e2] text-[#dc2626]',
};

const KPICard = ({ label, value, icon: Icon, bg, color, sub }) => (
  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm hover:shadow-md hover:border-[#bbf7d0] transition-all duration-200">
    <div className="flex items-start justify-between mb-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div className="p-1.5 bg-[#f0fdf4] rounded-lg">
        <ArrowUpRight size={14} className="text-[#16a34a]" />
      </div>
    </div>
    <p className="text-3xl font-extrabold text-[#111827] tracking-tight">{value}</p>
    <p className="text-[#6b7280] text-sm font-medium mt-1">{label}</p>
    {sub && <p className="text-[#16a34a] text-xs font-semibold mt-2">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 border-3 border-[#16a34a] border-t-transparent rounded-full" />
        <p className="text-[#6b7280] text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#111827] font-extrabold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-[#6b7280] text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#374151] hover:border-[#16a34a] hover:text-[#16a34a] transition text-sm font-semibold shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <KPICard label="Today's Revenue" value={fmt(data?.todayRevenue)} icon={IndianRupee}
          bg="bg-[#dcfce7]" color="text-[#16a34a]" sub={`${data?.todayOrders || 0} orders today`} />
        <KPICard label="Month Revenue" value={fmt(data?.monthRevenue)} icon={TrendingUp}
          bg="bg-[#fef9c3]" color="text-[#ca8a04]" sub={`${data?.monthOrders || 0} this month`} />
        <KPICard label="Pending Bills" value={data?.pendingBills || 0} icon={Clock}
          bg="bg-[#fee2e2]" color="text-[#dc2626]" sub={data?.pendingBills > 0 ? 'Awaiting payment' : 'All clear!'} />
        <KPICard label="Total Customers" value={data?.totalCustomers || 0} icon={Users}
          bg="bg-[#dbeafe]" color="text-[#2563eb]" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[#111827] font-bold text-base">Revenue Trend</h3>
              <p className="text-[#9ca3af] text-xs mt-0.5">Last 7 days</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#dcfce7] text-[#15803d] font-bold">₹ Daily</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data?.revenueChart || []} margin={{ left: 0, right: 4 }}>
              <defs>
                <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={52} />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid #dcfce7', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#greenFill)" dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-[#111827] font-bold text-base">Top Items Today</h3>
            <p className="text-[#9ca3af] text-xs mt-0.5">By quantity sold</p>
          </div>
          {(data?.topItems || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#9ca3af]">
              <p className="text-4xl mb-3">🍛</p>
              <p className="text-sm font-medium">No sales yet today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.topItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0
                    ${i === 0 ? 'bg-[#fef9c3] text-[#ca8a04]' : i === 1 ? 'bg-[#f3f4f6] text-[#374151]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#111827] text-sm font-semibold truncate">{item.name}</p>
                    <div className="w-full bg-[#f3f4f6] rounded-full h-1.5 mt-1.5">
                      <div className="bg-[#16a34a] h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (item.qty / (data.topItems[0]?.qty || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-[#6b7280] text-xs shrink-0 font-medium">{item.qty}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f3f4f6]">
          <h3 className="text-[#111827] font-bold text-base">Recent Orders</h3>
          <p className="text-[#9ca3af] text-xs mt-0.5">Latest billing activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f9fafb] text-[#6b7280] text-xs text-left">
                {['Bill No.', 'Table', 'Customer', 'Total', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-6 py-3.5 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {(data?.recentOrders || []).map((o) => (
                <tr key={o._id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-6 py-4 text-[#16a34a] font-bold">{o.billNumber || '—'}</td>
                  <td className="px-6 py-4 text-[#111827] font-semibold">{o.table?.name || '—'}</td>
                  <td className="px-6 py-4 text-[#6b7280]">{o.customer?.name || 'Walk-in'}</td>
                  <td className="px-6 py-4 text-[#111827] font-bold">{fmt(o.grandTotal)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[#9ca3af] text-xs font-medium">
                    {new Date(o.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {(data?.recentOrders || []).length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-[#9ca3af]">
                  <p className="text-4xl mb-3">🍛</p><p className="font-medium">No orders yet!</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
