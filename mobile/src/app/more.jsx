import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutGrid, BookOpen, Users, LogOut, Settings } from 'lucide-react-native';

const MENU_ITEMS = [
  { id: 'tables', title: 'Table Management', icon: LayoutGrid, color: '#3b82f6', path: '/tables' },
  { id: 'menu', title: 'Menu Management', icon: BookOpen, color: '#10b981', path: '/menu' },
  { id: 'customers', title: 'Customers', icon: Users, color: '#f59e0b', path: '/customers' },
  { id: 'settings', title: 'Settings', icon: Settings, color: '#8b5cf6', path: '/settings' },
];

export default function MoreScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // We can clear auth store here
    // router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => router.push(item.path)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
                <Icon size={22} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={[styles.iconBox, { backgroundColor: '#ef444422' }]}>
            <LogOut size={22} color="#ef4444" />
          </View>
          <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  list: { padding: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  chevron: { fontSize: 24, color: '#555', marginTop: -4 },
  logoutItem: { marginTop: 24, borderColor: '#ef444433' },
});
