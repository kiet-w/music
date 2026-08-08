import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function AlbumsScreen() {
  const router = useRouter();
  const { albums, isLoading, loadAlbums } = useAlbumStore();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      loadAlbums(accessToken);
    }
  }, [accessToken, loadAlbums]);

  const onRefresh = () => {
    if (accessToken) {
      loadAlbums(accessToken, true);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => router.push(`/albums/${item.id}`)}>
      <Image 
        source={{ uri: item.coverUrl || 'https://via.placeholder.com/150' }} 
        style={styles.cover} 
      />
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {isLoading && !albums.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No albums found</Text>
            </View>
          }
        />
      )}
      <Pressable style={styles.fab} onPress={() => Alert.alert('Coming Soon', 'Create album feature coming soon!')}>
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  list: {
    padding: 16,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#18181b',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#27272a',
  },
  title: {
    color: '#fafafa',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
    marginHorizontal: 8,
  },
  artist: {
    color: '#a1a1aa',
    fontSize: 12,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
});
