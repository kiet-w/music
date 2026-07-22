'use client';

import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CallbackStatusCardProps {
  status: 'loading' | 'success' | 'error';
  errorMsg?: string;
  onBackToMusic: () => void;
}

export function CallbackStatusCard({
  status,
  errorMsg,
  onBackToMusic,
}: CallbackStatusCardProps) {
  const t = useTranslations('Auth');

  return (
    <div className="max-w-md w-full p-8 bg-card border border-border rounded-[2.5rem] shadow-xl">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight">{t('google_connect_title')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t('google_connect_loading')}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight">{t('google_connect_success_title')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t('google_connect_success_desc')}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight">{t('google_connect_error_title')}</h1>
          <p className="text-red-400 text-sm mt-2 font-medium">{errorMsg}</p>
          <button
            onClick={onBackToMusic}
            className="mt-8 w-full bg-foreground text-background py-3 rounded-2xl font-bold hover:opacity-90 transition-all"
          >
            {t('back_to_music')}
          </button>
        </>
      )}
    </div>
  );
}
