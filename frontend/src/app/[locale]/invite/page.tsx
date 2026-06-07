'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getInviteInfo, acceptInvite } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { InvitePopup } from '@/components/molecules/Chat/InvitePopup';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';

export default function InvitePage() {
  const t = useTranslations('Chat');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { accessToken, user: currentUser } = useAuthStore();

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('link_expired'));
      setIsLoading(false);
      return;
    }

    getInviteInfo(token)
      .then((data) => {
        setInviteInfo(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch invite info:', err);
        setError(t('link_expired'));
        setIsLoading(false);
      });
  }, [token, t]);

  const handleAccept = async () => {
    if (!accessToken) {
      // Redirect to login if not authenticated, keeping the invite token
      router.push(`/auth/login?redirect=/invite?token=${token}`);
      return;
    }

    setIsProcessing(true);
    try {
      await acceptInvite(accessToken, token!);
      // Redirect to messages with the senderId to open the chat
      router.push(`/messages?u=${inviteInfo.senderId}`);
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setError(t('error_generic'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    router.push('/messages');
  };

  if (isLoading) {
    return (
      <MainContainer className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/60">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p>{t('invite_loading')}</p>
        </div>
      </MainContainer>
    );
  }

  if (error) {
    return (
      <MainContainer className="flex items-center justify-center">
        <div className="glass-dark p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <Button 
            onClick={() => router.push('/messages')}
            className="mt-6 bg-white/10 hover:bg-white/20 text-white"
          >
            {t('cancel')}
          </Button>
        </div>
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
        />
      )}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}
    </MainContainer>
  );
}
