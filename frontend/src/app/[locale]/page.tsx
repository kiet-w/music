import { LocaleRedirect } from '@/components/atoms/LocaleRedirect';

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
  return <LocaleRedirect locale={locale} />;
}
