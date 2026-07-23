'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FeatureAnnouncementCard } from '@/components/features/music/FeatureAnnouncementCard';

// ponytail: unified youtube announcement page structure with design.md tokens
export function YoutubePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('Music');
  const locale = params?.locale || 'vi';

  const handleGoToMusic = () => {
    router.push(`/${locale}/music`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background p-6 transition-colors duration-300">
      <FeatureAnnouncementCard
        title={t('youtube_upgrade_title')}
        description={t('youtube_upgrade_desc1')}
        secondaryDescription={t('youtube_upgrade_desc2')}
        actionText={t('go_to_music')}
        onAction={handleGoToMusic}
        footerText={t('pipeline_enabled')}
      />
    </div>
  );
}

export default YoutubePage;

