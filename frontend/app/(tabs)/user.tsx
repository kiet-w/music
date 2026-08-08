import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { updateProfile, changePassword } from '@/lib/api';

export default function UserScreen() {
  const { user, accessToken, updateUser, clearSession } = useAuthStore();
  const { currentTrack } = usePlayerStore();

  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    clearSession();
    router.replace('/(auth)/login');
  };

  const handleSaveProfile = async () => {
    if (!accessToken || !name.trim()) return;
    setIsUpdating(true);
    try {
      const updatedUser = await updateProfile(accessToken, { name: name.trim() });
      updateUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!accessToken || !newPassword.trim()) return;
    setIsChangingPassword(true);
    try {
      await changePassword(accessToken, { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed');
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar url={user?.avatar} fallback={user?.name?.charAt(0) || 'U'} size={80} />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Display Name</Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
              />
              <View style={styles.buttonRow}>
                <View style={styles.flex1}>
                  <Button title="Cancel" variant="secondary" onPress={() => setIsEditing(false)} />
                </View>
                <View style={styles.spacing} />
                <View style={styles.flex1}>
                  <Button title="Save" onPress={handleSaveProfile} loading={isUpdating} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.displayRow}>
              <Text style={styles.value}>{user?.name}</Text>
              <Button title="Edit" variant="secondary" size="sm" onPress={() => setIsEditing(true)} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Password</Text>
          {showPassword ? (
            <View style={styles.passwordContainer}>
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current Password"
                secureTextEntry
              />
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                secureTextEntry
              />
              <View style={styles.buttonRow}>
                <View style={styles.flex1}>
                  <Button title="Cancel" variant="secondary" onPress={() => setShowPassword(false)} />
                </View>
                <View style={styles.spacing} />
                <View style={styles.flex1}>
                  <Button title="Change" onPress={handleChangePassword} loading={isChangingPassword} />
                </View>
              </View>
            </View>
          ) : (
            <Button title="Change Password" variant="secondary" onPress={() => setShowPassword(true)} />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.card}>
          <View style={styles.displayRow}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </View>
        
        {currentTrack && (
          <View style={styles.card}>
            <Text style={styles.label}>Now Playing</Text>
            <Text style={styles.value} numberOfLines={1}>{currentTrack.title}</Text>
          </View>
        )}
      </View>

      <Button 
        title="Log Out" 
        variant="danger" 
        onPress={handleLogout} 
        style={styles.logoutButton} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  userEmail: {
    color: '#a1a1aa',
    fontSize: 16,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  label: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    color: '#fafafa',
    fontSize: 16,
    flex: 1,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editContainer: {
    marginTop: 8,
  },
  passwordContainer: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  flex1: {
    flex: 1,
  },
  spacing: {
    width: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
});
