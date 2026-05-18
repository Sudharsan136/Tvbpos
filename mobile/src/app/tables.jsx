import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LayoutGrid, Plus, Trash2, Edit2 } from 'lucide-react-native';
import api from '../api';
import { useRouter } from 'expo-router';

export default function TablesScreen() {
  const router = useRouter();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Table', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tables/${id}`);
            fetchTables();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete table');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table Management</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTables(); }} tintColor="#e94560" />}
      >
        <TouchableOpacity style={styles.addBtn}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addBtnText}>Add New Table</Text>
        </TouchableOpacity>

        {tables.map((table) => (
          <View key={table._id} style={styles.card}>
            <View style={styles.cardInfo}>
              <View style={styles.iconBox}>
                <LayoutGrid color="#3b82f6" size={20} />
              </View>
              <View>
                <Text style={styles.tableName}>{table.name}</Text>
                <Text style={styles.tableSection}>Section: {table.section}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Edit2 color="#888" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(table._id)}>
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  list: { padding: 16, paddingBottom: 40 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#3b82f622',
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  tableName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  tableSection: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#ffffff0a' },
});
