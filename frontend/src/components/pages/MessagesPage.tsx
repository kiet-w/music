'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { User } from '@/components/molecules/Chat/UserList';
import { MessagesHeader } from '@/components/molecules/Chat/MessagesHeader';
import { EmptyFriendListState } from '@/components/molecules/Chat/EmptyFriendListState';
import { EmptyChatState } from '@/components/molecules/Chat/EmptyChatState';
import { ChatSidebar } from '@/components/molecules/Chat/ChatSidebar';
import { ActiveChatSection } from '@/components/molecules/Chat/ActiveChatSection';
import { useChatStore } from '@/store/useChatStore';
import { useFriends } from '@/hooks/useFriends';
import { createInvite, acceptInvite } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getUserStatusText } from '@/lib/userStatus';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { cn } from '@/lib/utils';
import { useKeyboardMode } from '@/hooks/useKeyboardMode';

import { getEffectiveAccessToken } from '@/store/useAuthStore';

const FriendCodeModal = dynamic(
  () => import('@/components/molecules/Chat/FriendCodeModal').then((mod) => mod.FriendCodeModal),
  { ssr: false }
);

interface MessagesPageProps {
  locale: string;
}

export function MessagesPage({ locale }: MessagesPageProps) {
  useKeyboardMode('body');
  const t = useTranslations('Chat');
  const { users, loadUsers, currentUser, accessToken, isLoading: isLoadingFriends } = useFriends();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('u');
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
      loadUsers(accessToken).then((filteredUsers) => {
        if (targetUserId && filteredUsers.some((u: User) => u.id === targetUserId)) {
          setActiveReceiverId(targetUserId, accessToken);
        }
      });
    }
  }, [accessToken, targetUserId, loadUsers, setActiveReceiverId]);

  const handleSelectUser = useCallback((userId: string | null) => {
    const token = getEffectiveAccessToken();
    setActiveReceiverId(userId, token || undefined).catch((err) => {
      console.error('Failed to load chat:', err);
    });
  }, [setActiveReceiverId]);

  const handleSend = useCallback(async (content: string) => {
    const token = getEffectiveAccessToken();
    if (!token) return;
    try {
      await sendMessage(token, content);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || t('error_send_message') || 'Failed to send message');
    }
  }, [sendMessage, t]);

  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    const token = getEffectiveAccessToken();
    if (!token) return;
    try {
      await reactToMessage(token, messageId, emoji);
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  }, [reactToMessage]);

  const handleCreateInvite = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { token } = await createInvite(accessToken);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const locale = searchParams.get('locale') || 'vi';
      const inviteUrl = `${baseUrl}/${locale}/invite/${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('invite_success_copied') || 'Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to create invite:', error);
      toast.error(t('error_create_invite') || 'Failed to create invite link');
    }
  }, [accessToken, searchParams, t]);

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
      console.error('Failed to accept invite:', error);
      toast.error(error?.message || t('error_accept_invite') || 'Failed to accept friend invite');
    }
  }, [accessToken, loadUsers, setActiveReceiverId, t]);

  const activeChatPartner = users.find(u => u.id === activeReceiverId);
  const partnerStatus = getUserStatusText(activeChatPartner?.isOnline, activeChatPartner?.lastSeen);

  return (
    <MainContainer
      className={cn(
        "transition-all duration-200",
        activeReceiverId && "!max-w-full !w-full !px-0 !mx-0 !pt-[env(safe-area-inset-top)] !pb-0 h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden"
      )}
    >
      {!activeReceiverId && (
        <MessagesHeader
          title={t('title')}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
        />
      )}

      <div
        className={cn(
          "w-full flex-1 min-h-0 glass-dark border border-white/10 rounded-3xl overflow-hidden flex flex-col lg:flex-row",
          activeReceiverId && "!rounded-none !border-none !bg-background h-full"
        )}
      >
        {isLoadingFriends ? (
          <EmptyFriendListState
            onOpenTokenModal={() => setIsTokenModalOpen(true)}
            isLoading={true}
          />
        ) : users.length === 0 ? (
          <EmptyFriendListState
            onOpenTokenModal={() => setIsTokenModalOpen(true)}
            friendsCount={users.length}
            hasFriends={false}
            users={users}
            isLoading={false}
          />
        ) : (
          <>
            {/* Sidebar - User List Section */}
            <ChatSidebar
              users={users}
              activeReceiverId={activeReceiverId}
              unreadMessages={unreadMessages}
              onSelectUser={handleSelectUser}
            />

            {/* Main Chat Area Section */}
            {activeReceiverId ? (
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
              <section className="hidden lg:flex flex-1 flex-col h-full overflow-hidden">
                <EmptyChatState users={users} onSelectUser={handleSelectUser} />
              </section>
            )}
          </>
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
    </MainContainer>
  );
}

export default MessagesPage;
