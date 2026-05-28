import { getTranslations } from 'next-intl/server';
import AlbumDetailClient from '@/components/templates/AlbumDetailClient';
import { fetchAlbum } from '@/lib/api';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default async function AlbumDetailPage({ 
  params: { locale, id } 
}: { 
  params: { locale: string; id: string } 
}) {
  try {
    const album = await fetchAlbum(id);
    if (!album) notFound();
    return <AlbumDetailClient locale={locale} id={id} album={album} />;
  } catch (error) {
    console.error('Error fetching album:', error);
    notFound();
  }
}
