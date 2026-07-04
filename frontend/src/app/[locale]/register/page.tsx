import { RegisterPage } from '@/components/pages/RegisterPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <RegisterPage locale={locale} />;
}
