import { Minus, Plus, Trash2, ChefHat, Receipt, Tag } from 'lucide-react';
import useCartStore from '../../store/cartStore';

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

export default function CartPanel({ onFireKOT, onGenerateBill, loading }) {
  const { items, discountPercent, updateQty, removeItem, setDiscount, getSubtotal, getTaxAmount, getGrandTotal } = useCartStore();

  const subtotal = getSubtotal();
  const discountAmt = (subtotal * discountPercent) / 100;
  const tax = getTaxAmount();
  const grand = getGrandTotal();

  return (
    <div className="flex flex-col h-full bg-white border-l-2 border-[#dcfce7]">
      {/* Header */}
      <div className="px-5 py-4 border-b-2 border-[#f3f4f6] bg-[#f0fdf4]">
        <h3 className="text-[#111827] font-extrabold text-sm uppercase tracking-wider">Order Summary</h3>
        <p className="text-[#6b7280] text-xs mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} added</p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#9ca3af] py-10">
            <p className="text-5xl mb-4">🍛</p>
            <p className="text-sm font-semibold text-[#374151]">Cart is empty</p>
            <p className="text-xs mt-1 text-center">Pick items from the menu</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="bg-[#f9fafb] rounded-xl p-3.5 border border-[#e5e7eb]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[#111827] text-sm font-bold leading-tight truncate">{item.name}</p>
                  <p className="text-[#9ca3af] text-xs mt-0.5">{fmt(item.price)} each</p>
                </div>
                <button onClick={() => removeItem(item._id)}
                  className="p-1.5 rounded-lg text-[#dc2626] hover:bg-[#fee2e2] transition shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item._id, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-[#e5e7eb] hover:bg-[#16a34a] hover:text-white text-[#374151] flex items-center justify-center transition">
                    <Minus size={12} />
                  </button>
                  <span className="text-[#111827] font-extrabold w-6 text-center text-sm">{item.qty}</span>
                  <button onClick={() => updateQty(item._id, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-[#e5e7eb] hover:bg-[#16a34a] hover:text-white text-[#374151] flex items-center justify-center transition">
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-[#16a34a] font-extrabold text-sm">{fmt(item.price * item.qty)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t-2 border-[#f3f4f6] p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f0fdf4] border border-[#dcfce7]">
            <Tag size={13} className="text-[#16a34a] shrink-0" />
            <span className="text-[#374151] text-xs font-semibold">Discount</span>
            <input type="number" min={0} max={100} value={discountPercent}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="ml-auto w-14 px-2 py-1 rounded-lg bg-white border border-[#e5e7eb] text-[#111827] text-xs text-right focus:outline-none focus:border-[#16a34a]" />
            <span className="text-[#6b7280] text-xs font-semibold">%</span>
          </div>

          {/* Breakdown */}
          <div className="p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2 text-xs">
            <div className="flex justify-between text-[#6b7280]"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[#16a34a] font-semibold">
                <span>Discount ({discountPercent}%)</span><span>−{fmt(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6b7280]"><span>CGST + SGST</span><span>{fmt(tax)}</span></div>
            <div className="flex justify-between text-[#111827] font-extrabold text-sm pt-2 border-t border-[#e5e7eb]">
              <span>Grand Total</span><span className="text-[#16a34a]">{fmt(grand)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={onFireKOT} disabled={loading}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#fef9c3] hover:bg-[#fef08a] border-2 border-[#fde68a] text-[#a16207] text-sm font-bold transition disabled:opacity-50">
              <ChefHat size={15} /> KOT
            </button>
            <button onClick={onGenerateBill} disabled={loading}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold transition shadow-md shadow-[#16a34a]/25 disabled:opacity-50">
              <Receipt size={15} /> Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
