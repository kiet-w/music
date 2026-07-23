'use client';

import React, { use } from 'react';
import { InvitePopup } from '@/components/features/chat/InvitePopup';
import { InviteStateCard } from '@/components/features/chat/InviteStateCard';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { useInviteToken } from '@/hooks/useInviteToken';

interface InviteTokenPageProps {
  params: Promise<{
    locale: string;
    token: string;
  }>;
}

// ponytail: unified invite token page structure
export function InviteTokenPage({ params }: InviteTokenPageProps) {
  const { locale, token } = use(params);
  const {
    inviteInfo,
    error,
    isLoading,
    isProcessing,
    handleAccept,
    handleDecline,
    router,
    t,
  } = useInviteToken(token, locale);

  if (isLoading) {
    return (
      <MainContainer className="flex items-center justify-center">
        <InviteStateCard type="loading" message={t('invite_loading')} />
      </MainContainer>
    );
  }

  if (error) {
    return (
      <MainContainer className="flex items-center justify-center">
        <InviteStateCard
          type="error"
          title={error}
          buttonText={t('cancel')}
          onButtonClick={() => router.push(`/${locale}/messages`)}
        />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      {inviteInfo && (
        <InvitePopup
          senderName={inviteInfo.sender?.name || inviteInfo.sender?.email}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isLoading={isProcessing}
        />
      )}
    </MainContainer>
  );
}

export default InviteTokenPage;

