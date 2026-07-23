'use client';

import React from 'react';
import { MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User } from '@/components/features/chat/sidebar/UserList';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export interface EmptyFriendListStateProps {
  onOpenTokenModal: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
  friendsCount?: number;
  hasFriends?: boolean;
  users?: User[];
  isLoading?: boolean;
}

export function EmptyFriendListState({
  onOpenTokenModal,
  title,
  description,
  buttonText,
  className,
  friendsCount,
  hasFriends,
  users,
  isLoading,
}: EmptyFriendListStateProps) {
  const t = useTranslations('Chat');

  // Check if user actually has friends
  const userHasFriends =
    hasFriends ??
    (friendsCount !== undefined ? friendsCount > 0 : (users ? users.length > 0 : false));

  // If user already has friends, do not render empty state
  if (userHasFriends) {
    return null;
  }

  if (isLoading) {
    return <GlobalLoading />;
  }

  const displayTitle = title || t('no_conversations_title');
  const displayDescription = description || t('no_conversations_desc');
  const displayButtonText = buttonText || t('friend_code_token');

  return (
    <div className={cn("flex-1 p-6 sm:p-10 flex flex-col items-center justify-center text-center my-auto", className)}>
      <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5 text-white shadow-xl shadow-white/5">
        <MessageSquare className="w-10 h-10" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        {displayTitle}
      </h2>
      <p className="text-sm text-white/50 max-w-sm mb-8 leading-relaxed">
        {displayDescription}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          onClick={onOpenTokenModal}
          className="bg-white hover:bg-white/90 text-black font-bold rounded-2xl text-sm px-5 py-3 h-12 flex items-center gap-2.5 shadow-lg shadow-white/10 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          {displayButtonText}
        </Button>
      </div>
    </div>
  );
}

export default EmptyFriendListState;
