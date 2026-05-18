import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Home, ShoppingBag, ClipboardList, ChefHat, Menu } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      const inAuthGroup = segments[0] === 'login';
      
      if (!token && !inAuthGroup) {
        router.replace('/login');
      } else if (token && inAuthGroup) {
        router.replace('/');
      }
      setIsReady(true);
    };
    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <View style={isWeb ? styles.webContainer : styles.mobileContainer}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#e94560',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#e94560',
          tabBarInactiveTintColor: '#888',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="terminal"
          options={{
            title: 'Terminal',
            tabBarLabel: 'POS',
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="kitchen"
          options={{
            title: 'Kitchen',
            tabBarLabel: 'KOT',
            tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarLabel: 'Orders',
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarLabel: 'More',
            tabBarIcon: ({ color }) => <Menu size={24} color={color} />,
          }}
        />
        {/* Hidden screens */}
        <Tabs.Screen name="tables" options={{ href: null }} />
        <Tabs.Screen name="menu" options={{ href: null }} />
        <Tabs.Screen name="customers" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  webContainer: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#0f0f1a',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }
});
