import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Banknote, CreditCard, QrCode, SplitSquareHorizontal, Loader2, Printer } from 'lucide-react';
import PrintableReceipt from './PrintableReceipt';

const MODES = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-[#16a34a] bg-[#dcfce7]' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'text-[#2563eb] bg-[#dbeafe]' },
  { id: 'upi', label: 'UPI', icon: QrCode, color: 'text-[#7c3aed] bg-[#ede9fe]' },
  { id: 'split', label: 'Split', icon: SplitSquareHorizontal, color: 'text-[#d97706] bg-[#fef9c3]' },
];

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

export default function PaymentModal({ grandTotal, onConfirm, onClose, loading, orderData }) {
  const [mode, setMode] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(grandTotal);
  const change = Math.max(0, amountPaid - grandTotal);
  
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 shadow-2xl border border-[#e5e7eb] overflow-hidden">
        {/* Header */}
        <div className="bg-[#16a34a] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-extrabold text-lg">Collect Payment</h3>
              <p className="text-[#bbf7d0] text-xs mt-0.5">Topi Vappa Biriyani</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
              <X size={20} />
            </button>
          </div>
          {/* Amount */}
          <div className="mt-5 text-center">
            <p className="text-[#bbf7d0] text-xs font-bold uppercase tracking-widest">Amount Due</p>
            <p className="text-white text-5xl font-extrabold mt-1 tracking-tight">{fmt(grandTotal)}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Payment Mode */}
          <div>
            <p className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Payment Method</p>
            <div className="grid grid-cols-4 gap-2">
              {MODES.map(({ id, label, icon: Icon, color }) => (
                <button key={id} onClick={() => setMode(id)}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all ${
                    mode === id ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-[#e5e7eb] bg-[#f9fafb] hover:border-[#bbf7d0]'
                  }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mode === id ? color : 'bg-[#f3f4f6]'}`}>
                    <Icon size={18} className={mode === id ? color.split(' ')[0] : 'text-[#9ca3af]'} />
                  </div>
                  <span className={`text-[10px] font-bold ${mode === id ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash tendered */}
          {mode === 'cash' && (
            <div>
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Amount Tendered</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl bg-[#f9fafb] border-2 border-[#e5e7eb] text-[#111827] text-2xl font-extrabold focus:outline-none focus:border-[#16a34a] text-center transition" />
              {change > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#dcfce7] border-2 border-[#bbf7d0]">
                  <p className="text-[#15803d] text-sm font-extrabold text-center">💵 Return: {fmt(change)}</p>
                </div>
              )}
            </div>
          )}

          {/* Quick amounts */}
          {mode === 'cash' && (
            <div className="flex gap-2">
              {[500, 1000, 2000].map((amt) => (
                <button key={amt} onClick={() => setAmountPaid(amt)}
                  className="flex-1 py-2.5 rounded-xl bg-[#f3f4f6] hover:bg-[#dcfce7] hover:text-[#15803d] text-[#374151] text-sm font-bold transition border border-[#e5e7eb] hover:border-[#bbf7d0]">
                  ₹{amt}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={loading || !orderData}
              className="px-5 py-4 rounded-2xl bg-[#e5e7eb] hover:bg-[#d1d5db] text-[#374151] font-bold transition flex items-center justify-center gap-2"
              title="Print Bill"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={() => onConfirm({ paymentMode: mode, amountPaid: mode === 'cash' ? amountPaid : grandTotal })}
              disabled={loading || (mode === 'cash' && amountPaid < grandTotal)}
              className="flex-1 py-4 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-base transition shadow-lg shadow-[#16a34a]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : '✓ Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        <PrintableReceipt ref={printRef} order={orderData} />
      </div>
    </div>
  );
}
