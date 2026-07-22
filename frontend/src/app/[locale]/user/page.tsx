import React from 'react';
import { UserPage } from '@/components/pages/UserPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <UserPage locale={locale} />;
}
