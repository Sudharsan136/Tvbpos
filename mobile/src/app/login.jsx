import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import api from '../api';
import useAuthStore from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      // Important: backend now returns `token` in res.data.token
      if (res.data.token) {
        await login(res.data, res.data.token);
        router.replace('/');
      } else {
        Alert.alert('Error', 'Invalid login response from server');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your POS Terminal</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Mail color="#888" size={20} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Lock color="#888" size={20} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center' },
  formContainer: { padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  inputIcon: { padding: 16 },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    color: '#fff',
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: '#e94560',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
