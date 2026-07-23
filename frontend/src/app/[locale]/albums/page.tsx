import { AlbumsPage } from '@/components/pages/AlbumsPage';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <AlbumsPage locale={locale} />;
}
