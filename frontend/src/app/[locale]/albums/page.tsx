import React from 'react';
import { fetchAlbums } from '@/lib/api';
import AlbumsClient from './AlbumsClient';

export const revalidate = 0;

export default async function AlbumsPage({ params: { locale } }: { params: { locale: string } }) {
  return <AlbumsClient locale={locale} />;
}
