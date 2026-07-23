'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
    <div className={cn("flex flex-col gap-2 mb-6 mt-2 shrink-0", className)}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none text-foreground">{displayTitle}</h1>
        <Button
          onClick={onOpenTokenModal}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl text-xs sm:text-sm px-4 py-2 h-10 flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-white/5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          {displayButtonText}
        </Button>
      </div>
      <p className="text-base text-muted-foreground leading-relaxed font-sans">
        Trò chuyện và kết nối bạn bè.
      </p>
    </div>
  );
}

export default MessagesHeader;
