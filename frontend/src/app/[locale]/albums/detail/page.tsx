'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AlbumDetailClient from '@/components/templates/AlbumDetailClient';
import { fetchAlbum } from '@/lib/api';

export default function AlbumDetailStaticPage({ params: { locale } }: { params: { locale: string } }) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAlbum = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchAlbum(id);
      setAlbum(data);
    } catch (err) {
      console.error('Failed to load album:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAlbum();
    } else {
      setLoading(false);
    }
  }, [id, loadAlbum]);

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading album...</div>;
  }

  if (!id || !album) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Album không tồn tại hoặc lỗi đường dẫn.</p>
        <button 
          onClick={() => router.push(`/${locale}`)}
          className="text-primary underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return <AlbumDetailClient locale={locale} id={id} album={album} />;
}
