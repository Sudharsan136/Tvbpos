import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import api from '../api';
import socketService from '../services/socket';

const STATUS_COLORS = {
  pending: '#f59e0b',
  'in-progress': '#3b82f6',
  completed: '#10b981',
};

export default function TrackingScreen() {
  const [kots, setKots] = useState([]);
  const [connected, setConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKots = async () => {
    try {
      const res = await api.get('/dashboard/kots');
      setKots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch initial KOTs', err);
    }
  };

  useEffect(() => {
    fetchKots();

    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', 'kitchen');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_kot', (newKot) => {
      setKots((prev) => [newKot, ...prev]);
    });

    socket.on('kot_updated', (updatedKot) => {
      setKots((prev) =>
        prev.map((kot) =>
          kot._id === updatedKot.kotId ? { ...kot, ...updatedKot } : kot
        )
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_kot');
      socket.off('kot_updated');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKots();
    setRefreshing(false);
  };

  const handleItemDone = (kotId, itemIndex) => {
    const socket = socketService.getSocket();
    if (socket) socket.emit('kot_item_done', { kotId, itemIndex });
  };

  const handleKotComplete = (kotId) => {
    const socket = socketService.getSocket();
    if (socket) socket.emit('kot_complete', { kotId });
  };

  const activeKots = kots.filter((k) => k.status !== 'completed');
  const doneKots = kots.filter((k) => k.status === 'completed');

  const renderItem = ({ item }) => {
    const statusColor = STATUS_COLORS[item.status] || '#f59e0b';
    const isCompleted = item.status === 'completed';
    return (
      <View style={[styles.card, isCompleted && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
          <Text style={styles.kotNumber}>KOT #{item.kotNumber || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.status || 'pending').toUpperCase()}
            </Text>
          </View>
        </View>

        {(item.items || []).map((kotItem, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemQty}>{kotItem.quantity}x</Text>
            <Text style={styles.itemName}>{kotItem.name}</Text>
            {!isCompleted && kotItem.status !== 'done' ? (
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => handleItemDone(item._id, index)}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <Text style={kotItem.status === 'done' ? styles.itemDone : styles.itemPending}>
                {kotItem.status === 'done' ? '✓ Done' : '⏳ Pending'}
              </Text>
            )}
          </View>
        ))}

        {(!item.items || item.items.length === 0) && (
          <Text style={styles.noItemsText}>No items</Text>
        )}

        {!isCompleted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleKotComplete(item._id)}
          >
            <Text style={styles.completeBtnText}>✅ Mark All Done</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🍽️ Live Tracking</Text>
          <Text style={styles.headerSub}>Kitchen Order Tickets</Text>
        </View>
        <View style={[styles.dot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]}>
          <Text style={styles.dotLabel}>{connected ? 'LIVE' : 'OFF'}</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{kots.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
            {kots.filter((k) => k.status === 'pending' || !k.status).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
            {kots.filter((k) => k.status === 'in-progress').length}
          </Text>
          <Text style={styles.statLabel}>Cooking</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {doneKots.length}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Active KOT List */}
      <FlatList
        data={[...activeKots, ...doneKots]}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Waiting for orders...</Text>
            <Text style={styles.emptySubtitle}>
              {connected
                ? 'Connected to POS — new orders will appear here'
                : 'Connecting to server...'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#e9456033',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  dot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  dotLabel: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
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
  cardCompleted: { opacity: 0.5 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kotNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff0d',
    gap: 8,
  },
  itemQty: { fontSize: 14, color: '#e94560', fontWeight: 'bold', width: 30 },
  itemName: { flex: 1, fontSize: 15, color: '#ccc' },
  itemDone: { fontSize: 13, color: '#10b981', fontWeight: '600' },
  itemPending: { fontSize: 13, color: '#f59e0b' },
  doneBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  doneBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  completeBtn: {
    marginTop: 12,
    backgroundColor: '#10b98122',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeBtnText: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  noItemsText: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
