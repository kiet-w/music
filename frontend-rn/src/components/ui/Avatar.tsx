import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  url?: string | null;
  size?: number;
}

export function Avatar({ url, size = 40 }: AvatarProps) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return <Ionicons name="person-circle" size={size} color="#71717a" />;
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#27272a',
  },
});
