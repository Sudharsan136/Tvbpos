import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const emptyForm = { name: '', category: '', price: '', taxRate: 5, unit: 'plate', isVeg: true };

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchItems = () => api.get('/items').then((r) => setItems(r.data));
  const fetchCats = () => api.get('/items/categories').then((r) => setCategories(r.data));

  useEffect(() => { fetchItems(); fetchCats(); }, []);

  const filtered = items.filter(
    (i) => activeCategory === 'All' || i.category === activeCategory
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editId) {
        await api.put(`/items/${editId}`, form);
        toast.success('Item updated');
      } else {
        await api.post('/items', form);
        toast.success('Item added');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      fetchItems(); fetchCats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleEdit = (item) => {
    setForm({ name: item.name, category: item.category, price: item.price, taxRate: item.taxRate, unit: item.unit, isVeg: item.isVeg });
    setEditId(item._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/items/${id}`); toast.success('Deleted'); fetchItems(); fetchCats(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try { await api.patch(`/items/${id}/toggle`); fetchItems(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Menu Management</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6c63ff] hover:bg-[#7c74ff] text-white text-sm font-medium transition shadow-lg shadow-[#6c63ff]/30"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1a1d2e] border border-[#6c63ff]/30 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">{editId ? 'Edit Item' : 'Add New Item'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Item Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Category *</label>
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="cat-list" className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
              <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Price (₹) *</label>
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">GST Rate (%)</label>
              <select value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]">
                {[0, 5, 12, 18].map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Type</label>
              <select value={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]">
                <option value="true">🟢 Veg</option>
                <option value="false">🔴 Non-Veg</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#6c63ff] hover:bg-[#7c74ff] text-white text-sm font-medium transition disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {editId ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-xl bg-[#2a2f4a] text-[#94a3b8] hover:text-white text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...categories].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeCategory === cat ? 'bg-[#6c63ff] text-white' : 'bg-[#1a1d2e] text-[#94a3b8] hover:text-white border border-[#2a2f4a]'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-[#1a1d2e] border border-[#2a2f4a] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#20243a]">
            <tr className="text-[#94a3b8] text-xs text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">GST</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2f4a]">
            {filtered.map((item) => (
              <tr key={item._id} className="hover:bg-[#20243a] transition">
                <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                <td className="px-4 py-3 text-[#94a3b8]">{item.category}</td>
                <td className="px-4 py-3 text-[#6c63ff] font-semibold">₹{item.price}</td>
                <td className="px-4 py-3 text-[#94a3b8]">{item.taxRate}%</td>
                <td className="px-4 py-3">{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(item._id)} className="transition">
                    {item.isAvailable ? <ToggleRight size={22} className="text-[#22c55e]" /> : <ToggleLeft size={22} className="text-[#94a3b8]" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
