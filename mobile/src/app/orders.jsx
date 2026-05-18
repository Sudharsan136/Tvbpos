import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import api from '../api';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

const STATUS_COLORS = {
  paid: '#10b981', // green
  billed: '#f59e0b', // amber
  open: '#3b82f6', // blue
  cancelled: '#ef4444', // red
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || '#f59e0b';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.billNumber}>{item.billNumber || `Order #${item._id.substring(item._id.length - 6)}`}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || 'open').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>Table: <Text style={styles.highlightText}>{item.table?.name || '—'}</Text></Text>
          <Text style={styles.detailText}>Items: <Text style={styles.highlightText}>{item.items?.length || 0}</Text></Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>Total: <Text style={[styles.highlightText, { color: '#10b981' }]}>{fmt(item.grandTotal)}</Text></Text>
          <Text style={styles.detailText}>Date: <Text style={styles.highlightText}>{new Date(item.createdAt).toLocaleDateString()}</Text></Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Orders</Text>
        <Text style={styles.headerSub}>Order history & management</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>When orders are placed, they will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e9456033',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff11',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
    paddingBottom: 12,
  },
  billNumber: { fontSize: 16, fontWeight: 'bold', color: '#e94560' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: { fontSize: 13, color: '#888' },
  highlightText: { color: '#ccc', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
