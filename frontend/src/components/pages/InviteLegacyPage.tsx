'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { InviteStateCard } from '@/components/features/chat/InviteStateCard';
import { setInviteCookie } from '@/lib/inviteCookie';

function InviteLegacyContent() {
  const t = useTranslations('Chat');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setInviteCookie(token);
      // Smoothly redirect query-style invite link to clean rest path
      const currentPath = window.location.pathname;
      const locale = currentPath.split('/')[1] || 'vi';
      router.replace(`/${locale}/invite/${token}`);
    }
  }, [token, router]);

  if (!token) {
    return (
      <MainContainer className="flex items-center justify-center">
        <InviteStateCard
          type="error"
          title={t('link_expired')}
          buttonText={t('cancel')}
          onButtonClick={() => router.push('/messages')}
        />
      </MainContainer>
    );
  }

  return (
    <MainContainer className="flex items-center justify-center">
      <InviteStateCard type="loading" message={t('invite_loading')} />
    </MainContainer>
  );
}

export function InviteLegacyPage() {
  return (
    <Suspense
      fallback={
        <MainContainer className="flex items-center justify-center">
          <InviteStateCard type="loading" />
        </MainContainer>
      }
    >
      <InviteLegacyContent />
    </Suspense>
  );
}

export default InviteLegacyPage;
