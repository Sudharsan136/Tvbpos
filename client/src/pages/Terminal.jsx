import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useTableStore from '../store/tableStore';
import useCartStore from '../store/cartStore';
import useSocket from '../hooks/useSocket';
import TableCard from '../components/tables/TableCard';
import MenuPanel from '../components/billing/MenuPanel';
import CartPanel from '../components/billing/CartPanel';
import PaymentModal from '../components/billing/PaymentModal';
import { X, LayoutGrid } from 'lucide-react';

export default function Terminal() {
  const { tables, setTables } = useTableStore();
  const { items, activeOrderId, activeTableId, setActiveOrder, clearCart, setItems } = useCartStore();
  const socket = useSocket();

  const [selectedTable, setSelectedTable] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    api.get('/tables').then((r) => setTables(r.data));
  }, []);

  const handleTableClick = async (table) => {
    setSelectedTable(table);
    clearCart();
    setActiveOrder(null, table._id);
    if (table.currentOrder) {
      try {
        const orderId = typeof table.currentOrder === 'object' ? table.currentOrder._id : table.currentOrder;
        const res = await api.get(`/orders/${orderId}`);
        setOrderData(res.data);
        setActiveOrder(res.data._id, table._id);
        
        // Populate cart with existing items
        if (res.data.items) {
          const formattedItems = res.data.items.map(i => ({
            _id: i.item._id || i.item, // Handle populated or unpopulated item ref
            name: i.name,
            price: i.price,
            qty: i.qty,
            taxRate: i.taxRate,
            notes: i.notes || ''
          }));
          setItems(formattedItems);
        }
      } catch { toast.error('Failed to load order'); }
    }
  };

  const handleFireKOT = async () => {
    try {
      setLoading(true);
      let orderId = activeOrderId;
      if (!orderId) {
        const cartItems = useCartStore.getState().items;
        const res = await api.post('/orders', {
          tableId: activeTableId,
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
        orderId = res.data._id;
        setActiveOrder(orderId, activeTableId);
      } else {
        const cartItems = useCartStore.getState().items;
        await api.patch(`/orders/${orderId}/items`, {
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
      }
      await api.post(`/orders/${orderId}/kot`);
      toast.success('🔔 KOT sent to kitchen!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fire KOT');
    } finally { setLoading(false); }
  };

  const handleGenerateBill = async () => {
    if (orderData?.status === 'billed') {
      setShowPayment(true);
      return;
    }

    try {
      setLoading(true);
      let orderId = activeOrderId;
      if (!orderId) {
        const cartItems = useCartStore.getState().items;
        const res = await api.post('/orders', {
          tableId: activeTableId,
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
        orderId = res.data._id;
        setActiveOrder(orderId, activeTableId);
      }
      const res = await api.post(`/orders/${orderId}/bill`);
      setOrderData(res.data);
      setShowPayment(true);
    } catch (err) {
      if (err.response?.data?.message === 'Order already billed') {
        // If it somehow got billed by another device, fetch it and show payment
        const res = await api.get(`/orders/${activeOrderId}`);
        setOrderData(res.data);
        setShowPayment(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to generate bill');
      }
    } finally { setLoading(false); }
  };

  const handlePayment = async ({ paymentMode, amountPaid }) => {
    try {
      setLoading(true);
      await api.post(`/orders/${activeOrderId}/pay`, { paymentMode, amountPaid });
      toast.success('✅ Payment done! Table cleared.');
      setShowPayment(false);
      setSelectedTable(null);
      clearCart();
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setLoading(false); }
  };

  const sections = [...new Set(tables.map((t) => t.section))];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Floor + Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Floor plan section */}
        <div className={`bg-white border-b-2 border-[#dcfce7] px-6 py-5 shrink-0 ${selectedTable ? 'pb-3' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center">
                <LayoutGrid size={16} className="text-[#16a34a]" />
              </div>
              <h2 className="text-[#111827] font-extrabold text-base">Floor Plan</h2>
            </div>
            {selectedTable && (
              <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1.5 rounded-full">
                <span className="text-[#16a34a] text-sm font-bold">{selectedTable.name} selected</span>
                <button onClick={() => { setSelectedTable(null); clearCart(); }}
                  className="text-[#9ca3af] hover:text-[#374151] transition">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {!selectedTable && (
            <>
              {sections.map((section) => (
                <div key={section} className="mb-4 last:mb-0">
                  <p className="text-[#6b7280] text-xs font-bold uppercase tracking-wider mb-2.5">{section}</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {tables.filter((t) => t.section === section).map((table) => (
                      <TableCard key={table._id} table={table} onClick={handleTableClick} isActive={selectedTable?._id === table._id} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-[#f3f4f6]">
                {[
                  { dot: 'bg-[#16a34a]', label: 'Available' },
                  { dot: 'bg-[#f59e0b]', label: 'Occupied' },
                  { dot: 'bg-[#ef4444]', label: 'Billed' },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                    <span className="text-[#9ca3af] text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Menu panel */}
        {selectedTable ? (
          <div className="flex-1 overflow-hidden">
            <MenuPanel />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
            <div className="text-center">
              <p className="text-7xl mb-5">🍛</p>
              <p className="text-xl font-extrabold text-[#111827]">Select a table to begin</p>
              <p className="text-[#9ca3af] text-sm mt-2 font-medium">Click any table on the floor map above</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Cart */}
      {selectedTable && (
        <div className="w-72 shrink-0 overflow-hidden">
          <CartPanel onFireKOT={handleFireKOT} onGenerateBill={handleGenerateBill} loading={loading} />
        </div>
      )}

      {showPayment && (
        <PaymentModal
          grandTotal={orderData?.grandTotal || 0}
          onConfirm={handlePayment}
          onClose={() => setShowPayment(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
