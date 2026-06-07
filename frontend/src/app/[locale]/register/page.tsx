import { RegisterPage } from '@/components/pages/RegisterPage';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  return <RegisterPage locale={locale} />;
}
