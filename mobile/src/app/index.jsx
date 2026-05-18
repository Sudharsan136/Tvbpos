import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { TrendingUp, Users, Clock, IndianRupee, ArrowUpRight } from 'lucide-react-native';
import api from '../api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_COLORS = {
  paid: '#10b981',
  billed: '#f59e0b',
  open: '#3b82f6',
  cancelled: '#ef4444',
};

const KPICard = ({ label, value, icon: Icon, bg, color, sub }) => (
  <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon color={color} size={20} />
      </View>
      <ArrowUpRight color="#10b981" size={16} />
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
    {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
  </View>
);

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[styles.card, styles.skeletonCard]}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
              </View>
            ))}
          </View>
          <View style={[styles.section, styles.skeletonCard]}>
            <View style={[styles.skeletonLine, { marginBottom: 16 }]} />
            {[0,1,2].map(i => <View key={i} style={[styles.skeletonLine, { marginBottom: 12 }]} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
      >
        <View style={styles.grid}>
          <KPICard 
            label="Today's Revenue" 
            value={fmt(data?.todayRevenue)} 
            icon={IndianRupee}
            bg="#064e3b" 
            color="#10b981" 
            sub={`${data?.todayOrders || 0} orders today`} 
          />
          <KPICard 
            label="Month Revenue" 
            value={fmt(data?.monthRevenue)} 
            icon={TrendingUp}
            bg="#78350f" 
            color="#f59e0b" 
            sub={`${data?.monthOrders || 0} this month`} 
          />
          <KPICard 
            label="Pending Bills" 
            value={data?.pendingBills || 0} 
            icon={Clock}
            bg="#7f1d1d" 
            color="#ef4444" 
            sub={data?.pendingBills > 0 ? 'Awaiting payment' : 'All clear!'} 
          />
          <KPICard 
            label="Total Customers" 
            value={data?.totalCustomers || 0} 
            icon={Users}
            bg="#1e3a8a" 
            color="#3b82f6" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {(data?.recentOrders || []).map((o) => (
            <View key={o._id} style={styles.orderItem}>
              <View style={styles.orderRow}>
                <Text style={styles.orderBill}>{o.billNumber || '—'}</Text>
                <Text style={styles.orderTotal}>{fmt(o.grandTotal)}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderTable}>{o.table?.name || '—'}</Text>
                <Text style={[styles.orderStatus, { color: STATUS_COLORS[o.status] || '#888' }]}>
                  {o.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
          {(data?.recentOrders || []).length === 0 && (
            <Text style={styles.noDataText}>No orders yet!</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e9456033',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cardLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  cardSub: { fontSize: 10, color: '#10b981', marginTop: 8, fontWeight: '600' },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff0a',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderBill: { color: '#10b981', fontWeight: 'bold' },
  orderTotal: { color: '#fff', fontWeight: 'bold' },
  orderTable: { color: '#ccc', fontSize: 13 },
  orderStatus: { fontSize: 11, fontWeight: 'bold' },
  noDataText: { color: '#666', textAlign: 'center', paddingVertical: 20 },
  skeletonCard: { backgroundColor: '#1a1a2e' },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a3e',
    width: '80%',
  },
});
