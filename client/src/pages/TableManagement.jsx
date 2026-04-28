import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  const [form, setForm] = useState({
    number: '',
    name: '',
    capacity: 4,
    section: 'Main Hall',
  });

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch {
      toast.error('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setForm({
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        section: table.section,
      });
    } else {
      setEditingTable(null);
      // Auto-increment number for convenience
      const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
      setForm({
        number: nextNum,
        name: `T-${nextNum}`,
        capacity: 4,
        section: 'Main Hall',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTable(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable._id}`, form);
        toast.success('Table updated!');
      } else {
        await api.post('/tables', form);
        toast.success('Table added!');
      }
      fetchTables();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving table');
    }
  };

  const handleDelete = async (id, status) => {
    if (status !== 'available') {
      return toast.error('Cannot delete an occupied table');
    }
    if (!window.confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting table');
    }
  };

  const sections = [...new Set(tables.map((t) => t.section))];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#dcfce7] flex items-center justify-center">
            <LayoutGrid size={22} className="text-[#16a34a]" />
          </div>
          <div>
            <h1 className="text-[#111827] font-extrabold text-2xl">Table Management</h1>
            <p className="text-[#9ca3af] text-sm mt-0.5">Customize your floor plan</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold transition shadow-lg shadow-[#16a34a]/25"
        >
          <Plus size={18} /> Add Table
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-2 border-[#16a34a] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section} className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
              <h2 className="text-[#374151] font-bold text-lg mb-5 border-b border-[#f3f4f6] pb-3">{section}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables
                  .filter((t) => t.section === section)
                  .map((table) => (
                    <div
                      key={table._id}
                      className="border-2 border-[#e5e7eb] rounded-xl p-4 flex flex-col justify-between group hover:border-[#16a34a] transition relative"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-extrabold text-[#111827] text-lg">{table.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              table.status === 'available'
                                ? 'bg-[#dcfce7] text-[#16a34a]'
                                : table.status === 'occupied'
                                ? 'bg-[#fef3c7] text-[#d97706]'
                                : 'bg-[#fee2e2] text-[#dc2626]'
                            }`}
                          >
                            {table.status}
                          </span>
                        </div>
                        <p className="text-[#6b7280] text-xs font-medium">Capacity: {table.capacity} pax</p>
                        <p className="text-[#9ca3af] text-[10px] uppercase font-semibold tracking-wider mt-1">
                          No: {table.number}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#f3f4f6]">
                        <button
                          onClick={() => handleOpenModal(table)}
                          className="flex-1 py-1.5 rounded-lg text-[#374151] hover:bg-[#f3f4f6] transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(table._id, table.status)}
                          className="flex-1 py-1.5 rounded-lg text-[#dc2626] hover:bg-[#fee2e2] transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-5">
                <LayoutGrid size={36} className="text-[#9ca3af]" />
              </div>
              <p className="text-xl font-extrabold text-[#111827]">No tables found</p>
              <p className="text-[#9ca3af] text-sm mt-2 font-medium">Add tables to build your floor plan</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#e5e7eb] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#f3f4f6]">
              <h3 className="font-extrabold text-[#111827] text-lg">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#111827] flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Table Number
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-sm focus:outline-none focus:border-[#16a34a]"
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Table Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-sm focus:outline-none focus:border-[#16a34a]"
                    placeholder="e.g. T-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Capacity (Pax)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-sm focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-sm focus:outline-none focus:border-[#16a34a]"
                    placeholder="e.g. AC Hall"
                    list="section-options"
                  />
                  <datalist id="section-options">
                    {sections.map((sec) => (
                      <option key={sec} value={sec} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-[#f3f4f6]">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-sm transition shadow-lg shadow-[#16a34a]/25"
                >
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
