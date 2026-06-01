import React from 'react';
import AlbumsClient from '@/components/templates/AlbumsTemplate';

export const revalidate = 0;

export default async function AlbumsPage({ params: { locale } }: { params: { locale: string } }) {
  return <AlbumsClient locale={locale} />;
}
