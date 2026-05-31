'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import AlbumDetailClient from '@/components/templates/AlbumDetailClient';

export default function AlbumDetailStaticPage({ params: { locale } }: { params: { locale: string } }) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Album không tồn tại hoặc lỗi đường dẫn.</p>
      </div>
    );
  }

  return <AlbumDetailClient locale={locale} id={id} />;
}
