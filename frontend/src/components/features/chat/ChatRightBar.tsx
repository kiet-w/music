'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { User } from '@/components/features/chat/sidebar/UserList';
import { EmptyFriendListState } from '@/components/features/chat/sidebar/EmptyFriendListState';
import { ChatSidebar } from '@/components/features/chat/sidebar/ChatSidebar';
import { ActiveChatSection } from '@/components/features/chat/window/ActiveChatSection';
import { useChatStore } from '@/store/useChatStore';
import { useFriends } from '@/hooks/useFriends';
import { createInvite, acceptInvite } from '@/lib/api';
import { toast } from 'sonner';
import { getUserStatusText } from '@/lib/userStatus';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';
import { getEffectiveAccessToken } from '@/store/useAuthStore';
import { MessageSquare, X } from 'lucide-react';

const FriendCodeModal = dynamic(
  () => import('@/components/features/chat/FriendCodeModal').then((mod) => mod.FriendCodeModal),
  { ssr: false }
);

interface ChatRightBarProps {
  onClose?: () => void;
}

// ponytail: chat rightbar widget with clean header layout and optional close button
export default function ChatRightBar({ onClose }: ChatRightBarProps) {
  const t = useTranslations('Chat');
  const { users, loadUsers, currentUser, accessToken, isLoading: isLoadingFriends } = useFriends();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const { 
    messages, 
    activeReceiverId, 
    unreadMessages,
    setActiveReceiverId, 
    sendMessage, 
    reactToMessage,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
  } = useChatStore();

  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (accessToken && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      loadUsers(accessToken);
    }
  }, [accessToken, loadUsers]);

  const handleSelectUser = useCallback((userId: string | null) => {
    const token = getEffectiveAccessToken() || accessToken;
    setActiveReceiverId(userId, token || undefined).catch((err) => {
      console.error('Failed to load chat:', err);
    });
  }, [accessToken, setActiveReceiverId]);

  const handleSend = useCallback(async (content: string) => {
    const token = getEffectiveAccessToken() || accessToken;
    if (!token) {
      toast.error(t('error_not_authenticated') || 'Vui lòng đăng nhập lại');
      return;
    }
    try {
      await sendMessage(token, content);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || t('error_send_message') || 'Không thể gửi tin nhắn');
    }
  }, [accessToken, sendMessage, t]);

  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    const token = getEffectiveAccessToken();
    if (!token) return;
    try {
      await reactToMessage(token, messageId, emoji);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  }, [reactToMessage]);

  const handleCreateInvite = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { token } = await createInvite(accessToken);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const inviteUrl = `${baseUrl}/vi/invite/${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('invite_success_copied') || 'Link copied to clipboard!');
    } catch (error) {
      toast.error(t('error_create_invite') || 'Failed to create invite link');
    }
  }, [accessToken, t]);

  const handleAcceptInvite = useCallback(async () => {
    if (!accessToken) return;
    const input = prompt(t('prompt_enter_token') || 'Enter invite link or friend token:');
    if (!input) return;

    let token = input.trim();
    if (token.includes('token=')) {
      token = token.split('token=')[1].split('&')[0];
    } else if (token.includes('/invite/')) {
      const parts = token.split('/invite/');
      token = parts[1].split('?')[0].split('/')[0];
    }

    try {
      const res = await acceptInvite(accessToken, token);
      toast.success(t('accept_invite_success') || 'Successfully accepted friend invite!');
      await loadUsers(accessToken);
      if (res?.senderId) {
        setActiveReceiverId(res.senderId, accessToken);
      }
    } catch (error: any) {
      toast.error(error?.message || t('error_accept_invite') || 'Failed to accept invite');
    }
  }, [accessToken, loadUsers, setActiveReceiverId, t]);

  const activeChatPartner = users.find(u => u.id === activeReceiverId);
  const partnerStatus = getUserStatusText(activeChatPartner?.isOnline, activeChatPartner?.lastSeen);

  return (
    <div className="w-full h-full max-h-full bg-card border-none rounded-[2.5rem] overflow-hidden flex flex-col relative min-h-0 text-white">
      {/* RightBar Header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-white/5 text-white shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight truncate font-instrument">{t('title_and_friends')}</h2>
            <p className="text-[11px] text-zinc-400 font-medium">{t('friends_count', { count: users.length })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="text-xs font-semibold text-white/80 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            {t('add_friend')}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {isLoadingFriends || (activeReceiverId && isLoading && messages.length === 0) ? (
          <GlobalLoading message={t('loading_messages')} />
        ) : users.length === 0 ? (
          <EmptyFriendListState
            onOpenTokenModal={() => setIsTokenModalOpen(true)}
            friendsCount={users.length}
            hasFriends={false}
            users={users}
            isLoading={false}
          />
        ) : activeReceiverId ? (
          <ActiveChatSection
            activeReceiverId={activeReceiverId}
            activeChatPartner={activeChatPartner}
            partnerStatus={partnerStatus}
            messages={messages}
            currentUserId={currentUser?.id || ''}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMoreMessages={hasMoreMessages}
            onBack={() => handleSelectUser(null)}
            onLoadMore={() => accessToken && loadMoreMessages(accessToken)}
            onAcceptInvite={handleAcceptInvite}
            onCreateInvite={handleCreateInvite}
            onSend={handleSend}
            onReactToMessage={handleReactToMessage}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            <ChatSidebar
              users={users}
              activeReceiverId={null}
              unreadMessages={unreadMessages}
              onSelectUser={handleSelectUser}
            />
          </div>
        )}
      </div>

      {accessToken && (
        <FriendCodeModal
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          accessToken={accessToken}
          onSuccessConnect={async (senderId) => {
            if (accessToken) {
              await loadUsers(accessToken);
              setActiveReceiverId(senderId, accessToken);
            }
          }}
        />
      )}
    </div>
  );
}
