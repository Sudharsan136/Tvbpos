import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  discountPercent: 0,
  activeOrderId: null,
  activeTableId: null,

  setActiveOrder: (orderId, tableId) =>
    set({ activeOrderId: orderId, activeTableId: tableId }),

  setItems: (items) => set({ items }),

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i._id === item._id);
    if (existing) {
      set({
        items: items.map((i) =>
          i._id === item._id ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, qty: 1, notes: '' }] });
    }
  },

  removeItem: (itemId) =>
    set({ items: get().items.filter((i) => i._id !== itemId) }),

  updateQty: (itemId, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i._id !== itemId) });
    } else {
      set({
        items: get().items.map((i) =>
          i._id === itemId ? { ...i, qty } : i
        ),
      });
    }
  },

  updateNotes: (itemId, notes) =>
    set({
      items: get().items.map((i) =>
        i._id === itemId ? { ...i, notes } : i
      ),
    }),

  setDiscount: (discountPercent) => set({ discountPercent }),

  clearCart: () =>
    set({ items: [], discountPercent: 0, activeOrderId: null, activeTableId: null }),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

  getTaxAmount: () =>
    get().items.reduce(
      (sum, i) => sum + (i.price * i.qty * (i.taxRate || 5)) / 100,
      0
    ),

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = (subtotal * get().discountPercent) / 100;
    const taxable = subtotal - discount;
    const tax = get().items.reduce(
      (sum, i) => sum + (i.price * i.qty * (i.taxRate || 5)) / 100,
      0
    );
    return taxable + tax;
  },
}));

export default useCartStore;
