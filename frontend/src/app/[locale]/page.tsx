import { HomePage } from '@/components/pages/HomePage';

export async function generateStaticParams() {
  return [
    { locale: 'vi' },
    { locale: 'en' },
  ];
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomePage locale={locale} />;
}
