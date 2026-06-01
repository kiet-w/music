import React from 'react';
import HomePageClient from '@/components/templates/HomePageTemplate';

// Enable dynamic rendering but with standard Next.js caching
export const revalidate = 0; 

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  return <HomePageClient locale={locale} />;
}
