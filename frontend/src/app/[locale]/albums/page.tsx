import { AlbumsPage } from '@/components/pages/AlbumsPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  return <AlbumsPage locale={locale} />;
}
