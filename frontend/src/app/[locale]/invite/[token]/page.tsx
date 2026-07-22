import InviteTokenPage from '@/components/pages/InviteTokenPage';

export default function Page({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  return <InviteTokenPage params={params} />;
}
