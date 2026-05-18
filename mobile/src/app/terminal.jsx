import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LayoutGrid, Globe, X, ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react-native';
import api from '../api';
import useCartStore from '../store/cartStore';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function TerminalScreen() {
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('dine_in');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  // Store the actual order object for billed tables
  const [billedOrder, setBilledOrder] = useState(null);

  const {
    items: cartItems,
    activeOrderId,
    activeTableId,
    setActiveOrder,
    clearCart,
    setItems,
    addItem,
    removeItem,
    updateQty,
    getGrandTotal
  } = useCartStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [tRes, cRes, iRes] = await Promise.all([
        api.get('/tables'),
        api.get('/items/categories'),
        api.get('/items')
      ]);
      setTables(tRes.data);
      setCategories(cRes.data);
      setSelectedCategory(cRes.data[0]);
      setMenuItems(iRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTableClick = async (table) => {
    setPaySuccess(false);
    setBilledOrder(null);

    if (table.status === 'billed') {
      // For BILLED tables: find the order and open cart modal for payment
      try {
        setLoading(true);
        const res = await api.get('/orders?status=billed');
        const order = (res.data || []).find((o) => {
          const oTableId = o.table?._id || o.table;
          return String(oTableId) === String(table._id);
        });
        if (!order) {
          Alert.alert('Not found', 'Could not load order. Try refreshing.');
          return;
        }
        setBilledOrder(order);
        setSelectedTable(table);
        setActiveOrder(order._id, table._id);
        if (order.items) {
          setItems(order.items.map(i => ({
            _id: i.item?._id || i.item,
            name: i.name,
            price: i.price,
            qty: i.qty,
            taxRate: i.taxRate,
            notes: i.notes || ''
          })));
        }
        setShowCart(true);
      } catch (e) {
        Alert.alert('Error', 'Failed to load order.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For AVAILABLE / OCCUPIED tables: normal flow
    setSelectedTable(table);
    clearCart();
    setActiveOrder(null, table._id);
    if (table.currentOrder) {
      try {
        const orderId = typeof table.currentOrder === 'object'
          ? table.currentOrder._id
          : table.currentOrder;
        const res = await api.get(`/orders/${orderId}`);
        setActiveOrder(res.data._id, table._id);
        if (res.data.items) {
          setItems(res.data.items.map(i => ({
            _id: i.item?._id || i.item,
            name: i.name,
            price: i.price,
            qty: i.qty,
            taxRate: i.taxRate,
            notes: i.notes || ''
          })));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFireKOT = async () => {
    if (cartItems.length === 0) return;
    try {
      setLoading(true);
      let orderId = activeOrderId;
      if (!orderId) {
        const res = await api.post('/orders', {
          tableId: activeTableId,
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
        orderId = res.data._id;
        setActiveOrder(orderId, activeTableId);
      } else {
        await api.patch(`/orders/${orderId}/items`, {
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
      }
      await api.post(`/orders/${orderId}/kot`);
      setShowCart(false);
      const tRes = await api.get('/tables');
      setTables(tRes.data);
      Alert.alert('✅ KOT Sent', 'Order sent to kitchen!');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to fire KOT');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (cartItems.length === 0) return;
    try {
      setLoading(true);
      let orderId = activeOrderId;
      if (!orderId) {
        const res = await api.post('/orders', {
          tableId: activeTableId,
          items: cartItems.map((i) => ({ item: i._id, name: i.name, price: i.price, taxRate: i.taxRate, qty: i.qty })),
        });
        orderId = res.data._id;
        setActiveOrder(orderId, activeTableId);
      }
      await api.post(`/orders/${orderId}/bill`);
      setShowCart(false);
      const tRes = await api.get('/tables');
      setTables(tRes.data);
      Alert.alert('🧾 Bill Ready', 'Bill generated! Collect payment.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  // No Alert.alert — pure button tap to pay
  const handleRecordPayment = async () => {
    if (!billedOrder) return;
    try {
      setLoading(true);
      await api.post(`/orders/${billedOrder._id}/pay`, {
        paymentMode: 'cash',
        amountPaid: billedOrder.grandTotal || 0,
      });
      setPaySuccess(true);
      const tRes = await api.get('/tables');
      setTables(tRes.data);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeCart = () => {
    setShowCart(false);
    setPaySuccess(false);
    setBilledOrder(null);
  };

  const filteredItems = items.filter(i => i.category === selectedCategory);
  const isBilledTable = selectedTable?.status === 'billed';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS Terminal</Text>
      </View>

      {!selectedTable ? (
        // TABLE SELECTION VIEW
        <View style={styles.flex1}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'dine_in' && styles.tabBtnActive]}
              onPress={() => setActiveTab('dine_in')}
            >
              <LayoutGrid size={16} color={activeTab === 'dine_in' ? '#fff' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'dine_in' && styles.tabTextActive]}>Dine-In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'online' && styles.tabBtnActive]}
              onPress={() => setActiveTab('online')}
            >
              <Globe size={16} color={activeTab === 'online' ? '#fff' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'online' && styles.tabTextActive]}>Online</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.tableGrid}>
            {tables.map(table => (
              <TouchableOpacity
                key={table._id}
                style={[
                  styles.tableCard,
                  table.status === 'occupied' && styles.tableOccupied,
                  table.status === 'billed' && styles.tableBilled,
                ]}
                onPress={() => handleTableClick(table)}
                disabled={loading}
              >
                <Text style={[
                  styles.tableName,
                  (table.status === 'occupied' || table.status === 'billed') && { color: '#fff' }
                ]}>
                  {table.name}
                </Text>
                <Text style={[
                  styles.tableStatus,
                  (table.status === 'occupied' || table.status === 'billed') && { color: '#ffffffaa' }
                ]}>
                  {table.status.toUpperCase()}
                </Text>
                {table.status === 'billed' && (
                  <Text style={styles.tablePayHint}>💳 Tap to Pay</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Loading order...</Text>
            </View>
          )}
        </View>
      ) : !isBilledTable ? (
        // MENU SELECTION VIEW (occupied tables only)
        <View style={styles.flex1}>
          <View style={styles.activeTableBar}>
            <Text style={styles.activeTableText}>Table {selectedTable.name}</Text>
            <TouchableOpacity onPress={() => { setSelectedTable(null); clearCart(); }} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Change Table</Text>
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.menuList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.menuItem} onPress={() => addItem(item)}>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemPrice}>{fmt(item.price)}</Text>
                </View>
                <View style={styles.addBtn}>
                  <Plus size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.cartBanner} onPress={() => setShowCart(true)}>
            <View style={styles.cartBannerLeft}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.cartBannerItems}>{cartItems.reduce((acc, i) => acc + i.qty, 0)} Items</Text>
            </View>
            <Text style={styles.cartBannerTotal}>{fmt(getGrandTotal())} →</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Cart / Payment Modal */}
      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isBilledTable ? `💳 Payment — ${selectedTable?.name}` : 'Order Cart'}
            </Text>
            <TouchableOpacity onPress={closeCart}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {paySuccess ? (
            // SUCCESS STATE — no Alert needed
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Payment Recorded!</Text>
              <Text style={styles.successSub}>{selectedTable?.name} is now available.</Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => {
                  closeCart();
                  setSelectedTable(null);
                  clearCart();
                }}
              >
                <Text style={styles.successBtnText}>Back to Tables</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {cartItems.length === 0 ? (
                <View style={styles.emptyCart}>
                  <ShoppingCart size={48} color="#333" />
                  <Text style={styles.emptyCartText}>No items in cart</Text>
                </View>
              ) : (
                <FlatList
                  data={cartItems}
                  keyExtractor={item => item._id}
                  contentContainerStyle={styles.cartList}
                  renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>{fmt(item.price * item.qty)}</Text>
                      </View>
                      {!isBilledTable && (
                        <View style={styles.qtyControls}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item._id, item.qty - 1)}>
                            <Minus size={14} color="#fff" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item._id, item.qty + 1)}>
                            <Plus size={14} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item._id)}>
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                />
              )}

              <View style={styles.cartFooter}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalValue}>
                    {fmt(isBilledTable ? billedOrder?.grandTotal : getGrandTotal())}
                  </Text>
                </View>

                {isBilledTable ? (
                  // BILLED TABLE: single prominent payment button
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={handleRecordPayment}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={styles.payBtnInner}>
                          <CreditCard size={20} color="#fff" />
                          <Text style={styles.payBtnText}>Record Cash Payment & Release Table</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>
                ) : (
                  // NORMAL TABLE: Fire KOT + Bill buttons
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                      onPress={handleFireKOT}
                      disabled={loading || cartItems.length === 0}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Fire KOT</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                      onPress={handleGenerateBill}
                      disabled={loading || cartItems.length === 0}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Bill</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  flex1: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#1a1a2e', borderBottomWidth: 1, borderBottomColor: '#e9456033',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  tabBar: { flexDirection: 'row', padding: 16, gap: 12 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: '#ffffff11'
  },
  tabBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  tabText: { color: '#888', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },

  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  tableCard: {
    width: '48%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ffffff11', alignItems: 'center'
  },
  tableOccupied: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  tableBilled: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  tableName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  tableStatus: { fontSize: 11, color: '#888', fontWeight: '600' },
  tablePayHint: { fontSize: 11, color: '#fff', fontWeight: '700', marginTop: 4 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0f0f1acc', justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 14 },

  activeTableBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#ffffff11'
  },
  activeTableText: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  closeBtnText: { color: '#ef4444', fontSize: 13, fontWeight: 'bold' },

  categoriesBar: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff11' },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1a1a2e', marginLeft: 12, borderWidth: 1, borderColor: '#ffffff11'
  },
  catChipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  catText: { color: '#888', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#fff' },

  menuList: { padding: 16, paddingBottom: 100 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#ffffff11'
  },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  menuItemPrice: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e94560',
    alignItems: 'center', justifyContent: 'center'
  },

  cartBanner: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#10b981', borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 5,
  },
  cartBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBannerItems: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cartBannerTotal: { color: '#fff', fontWeight: '900', fontSize: 18 },

  modalContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff11'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 16 },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCartText: { color: '#666', marginTop: 12, fontSize: 16 },
  cartList: { padding: 16 },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 12
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 15, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  cartItemPrice: { fontSize: 13, color: '#10b981' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#fff', fontWeight: 'bold', fontSize: 16, width: 20, textAlign: 'center' },
  deleteBtn: { marginLeft: 8, padding: 4 },

  cartFooter: {
    padding: 20, borderTopWidth: 1, borderTopColor: '#ffffff11', backgroundColor: '#16213e'
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 18, color: '#fff' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#10b981' },
  actionBtns: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  payBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 18, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  payBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 72, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginBottom: 8 },
  successSub: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 32 },
  successBtn: {
    backgroundColor: '#10b981', paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 14, alignItems: 'center',
  },
  successBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
