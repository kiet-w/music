import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { register, verifyOtp } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore(state => state.setSession);

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await register({ name, email, password });
      if (res.requiresVerification) {
        setRequiresOtp(true);
      } else if (res.accessToken && res.user) {
        await setSession(res.accessToken, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp({ email, otp });
      if (res.accessToken && res.user) {
        await setSession(res.accessToken, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{requiresOtp ? 'Verify OTP' : 'Register'}</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {!requiresOtp ? (
        <>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
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
          <Button title="Register" onPress={handleRegister} loading={loading} style={styles.button} />
          
          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </Link>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>An OTP has been sent to {email}</Text>
          <Input
            label="OTP Code"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            keyboardType="numeric"
          />
          <Button title="Verify" onPress={handleVerifyOtp} loading={loading} style={styles.button} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 24,
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
  error: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
