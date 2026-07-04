import { AlbumsPage } from '@/components/pages/AlbumsPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AlbumsPage locale={locale} />;
}
