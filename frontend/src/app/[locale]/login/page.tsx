import { LoginPage } from '@/components/pages/LoginPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LoginPage locale={locale} />;
}
