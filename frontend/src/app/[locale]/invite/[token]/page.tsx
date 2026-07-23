import InviteTokenPage from '@/components/pages/InviteTokenPage';

export async function generateStaticParams() {
  return [
    { locale: 'vi', token: 'default' },
    { locale: 'en', token: 'default' },
  ];
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  return <InviteTokenPage params={params} />;
}
