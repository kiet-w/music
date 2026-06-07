import { LoginPage } from '@/components/pages/LoginPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  return <LoginPage locale={locale} />;
}
