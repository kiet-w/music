import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useAlbumDetail } from '@/hooks/api/useAlbumDetail';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function AlbumDetailScreen() {
  const { album, loading, router } = useAlbumDetail('en');
  const { play, currentTrack, isPlaying } = usePlayerStore();

  const handlePlayTrack = (track: any) => {
    // We should set the queue to the album tracks if not already set, but for simplicity we just play the track and add to queue in player store play().
    // wait, does track contain the album tracks? The API returns album with `songs`.
    play({
      id: track.id,
      title: track.title,
      artist: track.artist || album?.artist,
      url: track.url,
      coverUrl: track.coverUrl || album?.coverUrl,
      albumId: album?.id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!album) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Album not found</Text>
        </View>
      </View>
    );
  }

  const renderTrack = ({ item, index }: { item: any, index: number }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    return (
      <Pressable 
        style={[styles.trackItem, isCurrentTrack && styles.activeTrackItem]} 
        onPress={() => handlePlayTrack(item)}
      >
        <Text style={[styles.trackNumber, isCurrentTrack && styles.activeText]}>{index + 1}</Text>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isCurrentTrack && styles.activeText]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist || album.artist || 'Unknown Artist'}</Text>
        </View>
        <Ionicons 
          name={isCurrentTrack && isPlaying ? "pause" : "play"} 
          size={24} 
          color={isCurrentTrack ? "#6366f1" : "#fafafa"} 
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fafafa" />
        </Pressable>
      </View>
      
      <FlatList
        data={album.songs || []}
        keyExtractor={(item) => item.id}
        renderItem={renderTrack}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image 
              source={{ uri: album.coverUrl || 'https://via.placeholder.com/300' }} 
              style={styles.cover} 
            />
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.artist}>{album.artist || 'Unknown Artist'}</Text>
            {album.songs && album.songs.length > 0 && (
              <Pressable style={styles.playAllButton} onPress={() => handlePlayTrack(album.songs[0])}>
                <Ionicons name="play" size={24} color="#09090b" />
                <Text style={styles.playAllText}>Play</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tracks in this album</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#09090b',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 16,
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#27272a',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: '#a1a1aa',
    marginBottom: 24,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playAllText: {
    color: '#09090b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 24,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  activeTrackItem: {
    backgroundColor: '#18181b',
  },
  trackNumber: {
    width: 32,
    fontSize: 16,
    color: '#a1a1aa',
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 16,
    color: '#fafafa',
    marginBottom: 4,
  },
  activeText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  trackArtist: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 16,
  },
});
