'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getInviteInfo, acceptInvite } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { setInviteCookie, clearInviteCookie } from '@/lib/inviteCookie';

export function useInviteToken(token: string, locale: string) {
  const t = useTranslations('Chat');
  const router = useRouter();
  const { accessToken } = useAuthStore();

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

    setInviteCookie(token);

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
      const targetPath = `/${locale}/invite/${token}`;
      router.push(`/${locale}/login?redirect=${encodeURIComponent(targetPath)}`);
      return;
    }

    setIsProcessing(true);
    try {
      await acceptInvite(accessToken, token);
      clearInviteCookie();
      router.push(`/${locale}/messages?u=${inviteInfo?.senderId}`);
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
      setError(err?.message || t('error_generic'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    router.push(`/${locale}/messages`);
  };

  return {
    inviteInfo,
    error,
    isLoading,
    isProcessing,
    handleAccept,
    handleDecline,
    router,
    t,
  };
}
