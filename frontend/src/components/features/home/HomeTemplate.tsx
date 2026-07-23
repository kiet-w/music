'use client';

import React, { useState, useMemo } from 'react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { getMediaUrl } from '@/lib/utils';
import { HomeHeader } from './HomeHeader';
import { HomeHeroSection } from './HomeHeroSection';
import { HomeTopChartSection } from './HomeTopChartSection';
import { HomeMoodDiscoverySection } from './HomeMoodDiscoverySection';
import { HomeFeaturedPlaylistsSection } from './HomeFeaturedPlaylistsSection';
import { HomeNewReleasesSection } from './HomeNewReleasesSection';
import { AlbumItem, PlayTrackItem, ChartItem, MOCK_CHARTS, MOOD_CHIPS, NEW_RELEASES } from './types';

interface HomeTemplateProps {
  locale: string;
  albums: AlbumItem[];
  realTracks?: any[];
}

export function HomeTemplate({ locale, albums, realTracks = [] }: HomeTemplateProps) {
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const [activeRegion, setActiveRegion] = useState<'vn' | 'global' | 'usuk'>('vn');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transform real API tracks (from YouTube import / DB) into PlayTrackItem
  const formattedRealTracks: PlayTrackItem[] = useMemo(() => {
    return (realTracks || []).map((t) => {
      const processedUrl = getMediaUrl(t.url);
      const processedCover = getMediaUrl(t.coverUrl);
      return {
        id: String(t.id),
        title: String(t.title || 'Bài hát không tên'),
        artist: t.artist || 'YouTube Studio',
        url: processedUrl || undefined,
        coverUrl: processedCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      };
    });
  }, [realTracks]);

  // Hero Featured Track (prioritizes real track imported from YouTube)
  const featuredTrack: PlayTrackItem = useMemo(() => {
    if (formattedRealTracks.length > 0) {
      return formattedRealTracks[0];
    }
    return {
      id: 'hero-featured',
      title: 'Phóng Dân Chơi (Studio Sound)',
      artist: 'MCK ft. JustaTee',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    };
  }, [formattedRealTracks]);

  const isHeroPlaying = currentTrack?.id === featuredTrack.id && isPlaying;

  const handlePlayTrack = (item: PlayTrackItem) => {
    const trackToPlay: Track = {
      id: item.id,
      title: item.title,
      artist: item.artist || null,
      coverUrl: item.coverUrl || item.cover || undefined,
      url: item.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    };
    play(trackToPlay);
  };

  // Build chart list merging real YouTube/API tracks
  const chartList: ChartItem[] = useMemo(() => {
    const defaultRegionCharts = MOCK_CHARTS[activeRegion] || [];

    if (formattedRealTracks.length > 0) {
      const convertedRealChart: ChartItem[] = formattedRealTracks.map((t, idx) => ({
        id: t.id,
        rank: idx + 1,
        title: t.title,
        artist: t.artist || 'YouTube Studio',
        cover: t.coverUrl || t.cover || '',
        url: t.url || '',
        trend: idx === 0 ? 'up' : 'same',
        change: 0,
        duration: '3:30',
        genre: 'Pop'
      }));
      const merged = [...convertedRealChart, ...defaultRegionCharts].slice(0, 10);
      return merged.filter(item => 
        selectedGenre === 'Tất cả' || item.genre === selectedGenre
      );
    }

    return defaultRegionCharts.filter(item => 
      selectedGenre === 'Tất cả' || item.genre === selectedGenre
    );
  }, [activeRegion, formattedRealTracks, selectedGenre]);

  // Build New Releases merging real YouTube/API tracks
  const newReleasesList: PlayTrackItem[] = useMemo(() => {
    if (formattedRealTracks.length > 0) {
      return [...formattedRealTracks, ...NEW_RELEASES].slice(0, 8);
    }
    return NEW_RELEASES;
  }, [formattedRealTracks]);

  return (
    <MainContainer className="space-y-8 pb-12">
      {/* 1. Header Bar */}
      <HomeHeader 
        locale={locale} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {/* 2. Hero Section (Shows real YouTube imported track if available) */}
      <HomeHeroSection 
        locale={locale} 
        featuredTrack={featuredTrack} 
        isPlaying={isHeroPlaying} 
        onPlayTrack={handlePlayTrack} 
      />

      {/* 3. Top 10 Charts (Integrates real API audio tracks) */}
      <HomeTopChartSection 
        activeRegion={activeRegion} 
        setActiveRegion={setActiveRegion} 
        chartList={chartList} 
        currentTrackId={currentTrack?.id} 
        isPlaying={isPlaying} 
        onPlayTrack={handlePlayTrack} 
      />

      {/* 4. Mood Discovery */}
      <HomeMoodDiscoverySection 
        moodChips={MOOD_CHIPS} 
        selectedGenre={selectedGenre} 
        setSelectedGenre={setSelectedGenre} 
      />

      {/* 5. Featured Playlists / Albums */}
      <HomeFeaturedPlaylistsSection 
        locale={locale} 
        albums={albums} 
      />

      {/* 6. New Releases (Integrates real YouTube/API songs) */}
      <HomeNewReleasesSection 
        newReleases={newReleasesList} 
        onPlayTrack={handlePlayTrack} 
      />
    </MainContainer>
  );
}
