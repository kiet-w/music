import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useYoutubeDownloader } from '@/hooks/api/useYoutubeDownloader';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MusicScreen() {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    currentTime, 
    togglePlay, 
    playNext, 
    playPrevious 
  } = usePlayerStore();

  const {
    url,
    setUrl,
    title,
    setTitle,
    artist,
    setArtist,
    isDownloading,
    isFetchingInfo,
    status,
    handleSubmit
  } = useYoutubeDownloader();

  const handleDownload = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Now Playing</Text>
      
      <Card style={styles.playerCard}>
        {currentTrack ? (
          <>
            <View style={styles.coverContainer}>
              <Image 
                source={{ uri: currentTrack.coverUrl || 'https://via.placeholder.com/300' }} 
                style={styles.cover} 
              />
            </View>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist || 'Unknown Artist'}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
            
            <View style={styles.controls}>
              <Pressable onPress={playPrevious} style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={32} color="#fafafa" />
              </Pressable>
              
              <Pressable onPress={togglePlay} style={styles.playButton}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#09090b" />
              </Pressable>
              
              <Pressable onPress={playNext} style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={32} color="#fafafa" />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyPlayer}>
            <Ionicons name="musical-notes" size={64} color="#3f3f46" />
            <Text style={styles.emptyText}>No track playing</Text>
          </View>
        )}
      </Card>

      <Text style={styles.screenTitle}>Download from YouTube</Text>
      <Card style={styles.downloaderCard}>
        <Input
          label="YouTube URL"
          value={url}
          onChangeText={setUrl}
          placeholder="https://youtube.com/watch?v=..."
          autoCapitalize="none"
        />
        
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder={isFetchingInfo ? "Fetching info..." : "Song title"}
        />
        
        <Input
          label="Artist"
          value={artist}
          onChangeText={setArtist}
          placeholder="Artist name"
        />
        
        {status ? <Text style={styles.statusText}>{status}</Text> : null}
        
        <Button 
          title="Download" 
          onPress={handleDownload} 
          loading={isDownloading || isFetchingInfo} 
          style={styles.downloadButton} 
        />
      </Card>
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
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 16,
    marginTop: 8,
  },
  playerCard: {
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  coverContainer: {
    width: 240,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#27272a',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 4,
    textAlign: 'center',
  },
  trackArtist: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlayer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
    marginTop: 16,
    fontSize: 16,
  },
  downloaderCard: {
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
  },
  statusText: {
    color: '#6366f1',
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadButton: {
    marginTop: 8,
  },
});
