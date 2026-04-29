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
import { X, LayoutGrid, Globe, CheckCircle } from 'lucide-react';

export default function Terminal() {
  const { tables, setTables } = useTableStore();
  const { items, activeOrderId, activeTableId, setActiveOrder, clearCart, setItems } = useCartStore();
  const socket = useSocket();

  const [selectedTable, setSelectedTable] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Online Orders State
  const [activeTab, setActiveTab] = useState('dine_in'); // 'dine_in' | 'online'
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [selectedOnlineOrder, setSelectedOnlineOrder] = useState(null);

  useEffect(() => {
    api.get('/tables').then((r) => setTables(r.data));
    api.get('/orders?status=open').then((r) => {
      const online = r.data.filter(o => o.orderType === 'online');
      setOnlineOrders(online);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_online_order', (order) => {
      toast.success(`New online order from ${order.source}!`, { icon: '🔔' });
      setOnlineOrders((prev) => [order, ...prev]);
    });
    return () => socket.off('new_online_order');
  }, [socket]);

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
      
      // If it's an existing online order, we don't create a new one, we just fire KOT
      if (selectedOnlineOrder) {
        orderId = selectedOnlineOrder._id;
      } else if (!orderId) {
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

        {/* Tabs section */}
        <div className="bg-white border-b-2 border-[#dcfce7] px-6 py-4 shrink-0 flex gap-4">
          <button
            onClick={() => setActiveTab('dine_in')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
              activeTab === 'dine_in' ? 'bg-[#16a34a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={18} />
            Dine-In Tables
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition relative ${
              activeTab === 'online' ? 'bg-[#16a34a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe size={18} />
            Online Orders
            {onlineOrders.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {onlineOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Content based on Tab */}
        <div className={`bg-white border-b-2 border-[#dcfce7] px-6 py-5 shrink-0 ${selectedTable || selectedOnlineOrder ? 'pb-3' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#111827] font-extrabold text-base">
              {activeTab === 'dine_in' ? 'Floor Plan' : 'Incoming Online Orders'}
            </h2>
            {selectedTable && activeTab === 'dine_in' && (
              <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1.5 rounded-full">
                <span className="text-[#16a34a] text-sm font-bold">{selectedTable.name} selected</span>
                <button onClick={() => { setSelectedTable(null); clearCart(); }}
                  className="text-[#9ca3af] hover:text-[#374151] transition">
                  <X size={14} />
                </button>
              </div>
            )}
            {selectedOnlineOrder && activeTab === 'online' && (
              <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1.5 rounded-full">
                <span className="text-[#16a34a] text-sm font-bold">{selectedOnlineOrder.source.toUpperCase()} Order Selected</span>
                <button onClick={() => { setSelectedOnlineOrder(null); clearCart(); }}
                  className="text-[#9ca3af] hover:text-[#374151] transition">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {!selectedTable && activeTab === 'dine_in' && (
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

          {activeTab === 'online' && !selectedOnlineOrder && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {onlineOrders.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 col-span-full">No active online orders.</p>
              ) : (
                onlineOrders.map(order => (
                  <div
                    key={order._id}
                    onClick={() => {
                      setSelectedOnlineOrder(order);
                      setOrderData(order);
                      setActiveOrder(order._id, null);
                      if (order.items) {
                        setItems(order.items.map(i => ({
                          _id: i.item._id || i.item, name: i.name, price: i.price, qty: i.qty, taxRate: i.taxRate, notes: i.notes || ''
                        })));
                      }
                    }}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${order.source === 'zomato' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md text-white ${order.source === 'zomato' ? 'bg-red-500' : 'bg-orange-500'}`}>
                        {order.source.toUpperCase()}
                      </span>
                      <span className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="font-bold text-gray-800 text-sm">ID: {order.externalOrderId || order._id.slice(-6)}</p>
                    <p className="text-gray-600 text-xs mt-1">{order.items.length} items • ₹{order.grandTotal}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Menu panel */}
        {selectedTable && activeTab === 'dine_in' ? (
          <div className="flex-1 overflow-hidden">
            <MenuPanel />
          </div>
        ) : selectedOnlineOrder && activeTab === 'online' ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f9fafb]">
             <CheckCircle size={64} className="text-[#16a34a] mb-4 opacity-20" />
             <h3 className="text-2xl font-bold text-gray-800">Review Online Order</h3>
             <p className="text-gray-500 mt-2">Click "Fire KOT" to accept and send to kitchen.</p>
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
      {(selectedTable || selectedOnlineOrder) && (
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
