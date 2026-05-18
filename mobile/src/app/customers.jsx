import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Users, Search, Phone } from 'lucide-react-native';
import api from '../api';
import { useRouter } from 'expo-router';

export default function CustomersScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      const q = searchQuery ? `?search=${searchQuery}` : '';
      const res = await api.get(`/customers${q}`);
      setCustomers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCustomers(); }} tintColor="#e94560" />}
      >
        {customers.map((customer) => (
          <View key={customer._id} style={styles.card}>
            <View style={styles.iconBox}>
              <Users color="#f59e0b" size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <View style={styles.phoneRow}>
                <Phone size={12} color="#888" />
                <Text style={styles.customerPhone}>{customer.phone}</Text>
              </View>
            </View>
            <View style={styles.stats}>
              <Text style={styles.statsLabel}>Visits</Text>
              <Text style={styles.statsValue}>{customer.totalVisits || 0}</Text>
            </View>
          </View>
        ))}
        {customers.length === 0 && (
          <Text style={styles.noData}>No customers found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e9456033',
  },
  backBtn: { marginRight: 16 },
  backText: { fontSize: 32, color: '#fff', marginTop: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#f59e0b22',
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  cardInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerPhone: { fontSize: 13, color: '#888' },
  stats: { alignItems: 'flex-end' },
  statsLabel: { fontSize: 11, color: '#888' },
  statsValue: { fontSize: 16, fontWeight: 'bold', color: '#f59e0b', marginTop: 2 },
  noData: { color: '#666', textAlign: 'center', marginTop: 40 },
});
