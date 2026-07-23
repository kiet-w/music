'use client';

import React from 'react';
import { MessageSquare, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User } from '@/components/features/chat/sidebar/UserList';

export interface EmptyChatStateProps {
  title?: string;
  description?: string;
  className?: string;
  users?: User[];
  onSelectUser?: (userId: string) => void;
}

export function EmptyChatState({
  title,
  description,
  className,
  users,
  onSelectUser,
}: EmptyChatStateProps) {
  const t = useTranslations('Chat');

  const displayTitle = title || t('no_chat_selected');
  const displayDescription = description || t('no_chat_selected_desc');

  const firstUser = users && users.length > 0 ? users[0] : null;

  return (
    <div className={cn("flex-1 p-6 flex flex-col items-center justify-center text-center my-auto", className)}>
      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white shadow-lg shadow-white/5">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">
        {displayTitle}
      </h3>
      <p className="text-xs text-white/50 max-w-xs mb-6">
        {displayDescription}
      </p>

      {firstUser && onSelectUser && (
        <Button
          onClick={() => onSelectUser(firstUser.id)}
          className="bg-white hover:bg-white/90 text-black font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-white/10"
        >
          <MessageCircle className="w-4 h-4" />
          {t('conversation') || 'Trò chuyện'} với {firstUser.name || firstUser.email}
        </Button>
      )}
    </div>
  );
}

export default EmptyChatState;
