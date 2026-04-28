import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import api from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = (q = '') => {
    api.get(`/customers${q ? `?search=${q}` : ''}`)
      .then((r) => setCustomers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchCustomers(e.target.value);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl flex items-center gap-2">
          <Users size={22} className="text-[#6c63ff]" /> Customers
        </h1>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
        <input value={search} onChange={handleSearch} placeholder="Search by name or phone..."
          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#1a1d2e] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
      </div>

      <div className="bg-[#1a1d2e] border border-[#2a2f4a] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#20243a]">
              <tr className="text-[#94a3b8] text-xs text-left">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2f4a]">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-[#20243a] transition">
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{c.phone}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-[#94a3b8]">{c.gstin || '—'}</td>
                  <td className="px-4 py-3 text-[#94a3b8] text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-[#94a3b8]">No customers found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
