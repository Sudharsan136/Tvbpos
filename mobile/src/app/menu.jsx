import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { BookOpen, Plus, Trash2, Edit2 } from 'lucide-react-native';
import api from '../api';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/items/${id}`);
            fetchItems();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete item');
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
        <Text style={styles.headerTitle}>Menu Management</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#e94560" />}
      >
        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Add Menu', 'Coming soon')}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addBtnText}>Add New Item</Text>
        </TouchableOpacity>

        {items.map((item) => (
          <View key={item._id} style={styles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={styles.iconBox}>
                <BookOpen color="#10b981" size={20} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.category} • ₹{item.price}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Edit', 'Coming soon')}>
                <Edit2 color="#888" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id)}>
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
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
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
  image: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#10b98122',
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  itemMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#ffffff0a' },
});
