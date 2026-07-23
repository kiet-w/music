import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/albums`);
}
