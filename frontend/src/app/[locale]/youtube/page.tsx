import YoutubePage from '@/components/pages/YoutubePage';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default function Page() {
  return <YoutubePage />;
}
