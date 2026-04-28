import { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [form, setForm] = useState({
    restaurantName: 'My Restaurant',
    address: '123 Food Street, Chennai, TN - 600001',
    phone: '+91 98765 43210',
    gstin: '33ABCDE1234F1Z5',
    invoicePrefix: 'INV',
    gstType: 'intrastate',
  });

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('restaurantSettings', JSON.stringify(form));
    toast.success('Settings saved!');
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-white font-bold text-2xl flex items-center gap-2 mb-6">
        <SettingsIcon size={22} className="text-[#6c63ff]" /> Settings
      </h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Business Info */}
        <div className="bg-[#1a1d2e] border border-[#2a2f4a] rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Business Information</h3>
          <div className="space-y-4">
            {[
              { label: 'Restaurant Name', key: 'restaurantName' },
              { label: 'Address', key: 'address' },
              { label: 'Phone', key: 'phone' },
              { label: 'GSTIN', key: 'gstin' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-[#94a3b8] mb-1 block">{label}</label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-[#1a1d2e] border border-[#2a2f4a] rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Invoice Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#94a3b8] mb-1 block">Invoice Prefix</label>
              <input value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                className="w-40 px-4 py-2.5 rounded-xl bg-[#0f1117] border border-[#2a2f4a] text-white text-sm focus:outline-none focus:border-[#6c63ff]" />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8] mb-2 block">GST Type</label>
              <div className="flex gap-3">
                {[
                  { val: 'intrastate', label: 'Intrastate (CGST + SGST)' },
                  { val: 'interstate', label: 'Interstate (IGST)' },
                ].map(({ val, label }) => (
                  <button key={val} type="button"
                    onClick={() => setForm({ ...form, gstType: val })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${form.gstType === val ? 'border-[#6c63ff] bg-[#6c63ff]/10 text-white' : 'border-[#2a2f4a] text-[#94a3b8] hover:border-[#6c63ff]/50'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6c63ff] hover:bg-[#7c74ff] text-white font-semibold transition shadow-lg shadow-[#6c63ff]/30">
          <Save size={16} /> Save Settings
        </button>
      </form>
    </div>
  );
}
