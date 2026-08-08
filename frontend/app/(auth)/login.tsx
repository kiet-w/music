import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Link, useRouter } from 'expo-router';
// import { login } from '@/lib/api';
// import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    // await login(email, password);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/music');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} loading={loading} style={styles.button} />
      
      <Link href="/(auth)/register" style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
  link: {
    marginTop: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  linkText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
});
