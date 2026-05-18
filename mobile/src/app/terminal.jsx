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
import { LayoutGrid, Globe, X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
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
    setSelectedTable(table);
    clearCart();
    setActiveOrder(null, table._id);
    if (table.currentOrder) {
      try {
        const orderId = typeof table.currentOrder === 'object' ? table.currentOrder._id : table.currentOrder;
        const res = await api.get(`/orders/${orderId}`);
        setActiveOrder(res.data._id, table._id);
        
        if (res.data.items) {
          const formattedItems = res.data.items.map(i => ({
            _id: i.item._id || i.item,
            name: i.name,
            price: i.price,
            qty: i.qty,
            taxRate: i.taxRate,
            notes: i.notes || ''
          }));
          setItems(formattedItems);
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
      Alert.alert("Success", "KOT sent to kitchen!");
      setShowCart(false);
      
      // Refresh table status
      const tRes = await api.get('/tables');
      setTables(tRes.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fire KOT");
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
      Alert.alert("Success", "Bill generated! Proceed to collect payment.");
      
      const tRes = await api.get('/tables');
      setTables(tRes.data);
      setShowCart(false);
    } catch (err) {
      Alert.alert("Error", "Failed to generate bill");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (table) => {
    if (!table.currentOrder) {
      Alert.alert("Error", "No active order found for this table.");
      return;
    }
    Alert.alert(
      "Record Payment",
      `Mark ${table.name} as paid and release the table?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Paid",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              // currentOrder is populated: { _id, status, grandTotal }
              const orderId = table.currentOrder?._id || table.currentOrder;
              const grandTotal = table.currentOrder?.grandTotal || 0;
              if (!orderId) {
                Alert.alert("Error", "No order found for this table.");
                return;
              }
              await api.post(`/orders/${orderId}/pay`, {
                paymentMode: 'cash',
                amountPaid: grandTotal,
              });
              Alert.alert("✅ Done!", `${table.name} has been released.`);
              clearCart();
              setSelectedTable(null);
              const tRes = await api.get('/tables');
              setTables(tRes.data);
            } catch (err) {
              Alert.alert("Error", "Failed to record payment.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredItems = items.filter(i => i.category === selectedCategory);

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
                onPress={() => {
                  if (table.status === 'billed') {
                    handleRecordPayment(table);
                  } else {
                    handleTableClick(table);
                  }
                }}
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
                  <Text style={styles.tablePayHint}>Tap to Pay 💳</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // MENU SELECTION VIEW
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

          {/* Sticky Cart Banner */}
          <TouchableOpacity style={styles.cartBanner} onPress={() => setShowCart(true)}>
            <View style={styles.cartBannerLeft}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.cartBannerItems}>{cartItems.reduce((acc, i) => acc + i.qty, 0)} Items</Text>
            </View>
            <Text style={styles.cartBannerTotal}>{fmt(getGrandTotal())} →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Cart</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <ShoppingCart size={48} color="#333" />
              <Text style={styles.emptyCartText}>Cart is empty</Text>
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
                    <Text style={styles.cartItemPrice}>{fmt(item.price)}</Text>
                  </View>
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
                </View>
              )}
            />
          )}

          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{fmt(getGrandTotal())}</Text>
            </View>
            
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
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  flex1: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e9456033',
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
  tablePayHint: { fontSize: 11, color: '#fff', fontWeight: '700', marginTop: 4, opacity: 0.9 },

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
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
  },
  cartBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBannerItems: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cartBannerTotal: { color: '#fff', fontWeight: '900', fontSize: 18 },

  modalContainer: { flex: 1, backgroundColor: '#0f0f1a' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff11'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
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
});
