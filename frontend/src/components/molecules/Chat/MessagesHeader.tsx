'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';

export interface MessagesHeaderProps {
  title?: string;
  onOpenTokenModal: () => void;
  buttonText?: string;
  className?: string;
}

export function MessagesHeader({
  title,
  onOpenTokenModal,
  buttonText,
  className,
}: MessagesHeaderProps) {
  const t = useTranslations('Chat');
  const displayTitle = title || t('title');
  const displayButtonText = buttonText || t('friend_code');

  return (
    <header className={cn("flex items-center justify-between gap-2 shrink-0", className)}>
      <h1 className="text-2xl font-bold text-white shadow-text">{displayTitle}</h1>
      <Button
        onClick={onOpenTokenModal}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold rounded-2xl text-xs sm:text-sm px-4 py-2 h-10 flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/10"
      >
        <UserPlus className="w-4 h-4" />
        {displayButtonText}
      </Button>
    </header>
  );
}

export default MessagesHeader;
