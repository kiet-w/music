import { ForgotPasswordPage } from '@/components/pages/ForgotPasswordPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ForgotPasswordPage locale={locale} />;
}
