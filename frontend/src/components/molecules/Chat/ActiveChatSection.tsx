'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { User } from '@/components/molecules/Chat/UserList';
import { ChatWindow } from '@/components/molecules/Chat/ChatWindow';
import { ChatInput } from '@/components/molecules/Chat/ChatInput';
import { PresenceStatusBadge } from '@/components/atoms/PresenceStatusBadge';
import { cn } from '@/lib/utils';

interface ActiveChatSectionProps {
  activeReceiverId: string | null;
  activeChatPartner?: User;
  partnerStatus: { isOnline: boolean; text: string };
  messages: any[];
  currentUserId: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  onBack: () => void;
  onLoadMore: () => void;
  onAcceptInvite: () => void;
  onCreateInvite: () => void;
  onSend: (content: string) => Promise<void>;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

export function ActiveChatSection({
  activeReceiverId,
  activeChatPartner,
  partnerStatus,
  messages,
  currentUserId,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  onBack,
  onLoadMore,
  onAcceptInvite,
  onCreateInvite,
  onSend,
  onReactToMessage,
}: ActiveChatSectionProps) {
  const t = useTranslations('Chat');

  return (
    <section
      className={cn(
        'flex-1 flex flex-col h-full overflow-hidden min-w-0 min-h-0',
        activeReceiverId ? 'flex' : 'hidden lg:flex'
      )}
    >
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur-md shrink-0 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 hover:bg-white/10 rounded-full transition-colors text-white shrink-0 flex items-center gap-1 cursor-pointer"
            title={t('back_to_list') || 'Quay lại danh sách bạn bè'}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-xs text-white/70 font-medium hidden sm:inline">{t('friends') || 'Bạn bè'}</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-white font-bold truncate text-sm sm:text-base">
              {activeChatPartner?.name || activeChatPartner?.email || t('conversation')}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] min-w-0 mt-0.5">
              <PresenceStatusBadge
                isOnline={partnerStatus.isOnline}
                text={partnerStatus.text}
              />
              {activeChatPartner?.email && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-white/40 truncate">{activeChatPartner.email}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <ChatWindow
          messages={messages}
          currentUserId={currentUserId}
          partner={activeChatPartner}
          onLoadMore={onLoadMore}
          hasMore={hasMoreMessages}
          isLoadingMore={isLoadingMore}
          onAcceptInvite={onAcceptInvite}
          onCreateInvite={onCreateInvite}
          onReactToMessage={onReactToMessage}
        />
      )}

      <ChatInput onSend={onSend} />
    </section>
  );
}
