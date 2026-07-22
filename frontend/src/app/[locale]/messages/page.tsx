'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, UserPlus, Link2, MessageSquare } from 'lucide-react';
import { UserList, User } from '@/components/molecules/Chat/UserList';
import { ChatWindow } from '@/components/molecules/Chat/ChatWindow';
import { ChatInput } from '@/components/molecules/Chat/ChatInput';
import { Button } from '@/components/atoms/ui/button';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchFriends, createInvite, acceptInvite } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getUserStatusText } from '@/lib/userStatus';

import { MainContainer } from '@/components/templates/wrappers/MainContainer';

import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const t = useTranslations('Chat');
  const { user: currentUser, accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('u');
  const { 
    messages, 
    activeReceiverId, 
    unreadMessages,
    setActiveReceiverId, 
    sendMessage, 
    subscribeToMessages, 
    unsubscribeFromMessages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
    socket
  } = useChatStore();

  const [users, setUsers] = useState<User[]>([]);
  const [, setTicker] = useState<number>(0);

  // Periodic ticker to refresh relative time strings (e.g. 5 phút -> 1 giờ -> 2 giờ)
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadUsers = async (token: string) => {
    try {
      const data = await fetchFriends(token);
      const filteredUsers = data.filter((u: User) => u.id !== currentUser?.id);
      setUsers(filteredUsers);
      return filteredUsers;
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      toast.error(t('error_loading_users') || 'Failed to load friends');
      return [];
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadUsers(accessToken).then((filteredUsers) => {
        if (targetUserId && filteredUsers.some((u: User) => u.id === targetUserId)) {
          setActiveReceiverId(targetUserId, accessToken);
        }
      });
    }
  }, [accessToken, currentUser?.id, targetUserId, setActiveReceiverId]);

  useEffect(() => {
    if (currentUser?.id) {
      subscribeToMessages(currentUser.id);
    }
    return () => unsubscribeFromMessages();
  }, [currentUser?.id, subscribeToMessages, unsubscribeFromMessages]);

  // Listen for realtime presence updates from socket
  useEffect(() => {
    if (!socket) return;

    const handlePresence = (data: { userId: string; isOnline: boolean; lastSeen: string | null }) => {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === data.userId
            ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : user
        )
      );
    };

    socket.on('userPresenceChanged', handlePresence);
    return () => {
      socket.off('userPresenceChanged', handlePresence);
    };
  }, [socket]);

  const handleSelectUser = (userId: string | null) => {
    if (accessToken) {
      setActiveReceiverId(userId, accessToken).catch((err) => {
        console.error('Failed to load chat:', err);
        toast.error(t('error_loading_chat') || 'Failed to load chat history');
      });
    }
  };

  const handleSend = async (content: string) => {
    if (!accessToken) return;
    try {
      await sendMessage(accessToken, content);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || t('error_send_message') || 'Failed to send message');
    }
  };

  const handleCreateInvite = async () => {
    if (!accessToken) return;
    try {
      const { token } = await createInvite(accessToken);
      const inviteUrl = `${window.location.origin}/${searchParams.get('locale') || 'vi'}/invite?token=${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('invite_success_copied') || 'Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to create invite:', error);
      toast.error(t('error_create_invite') || 'Failed to create invite link');
    }
  };

  const handleAcceptInvite = async () => {
    if (!accessToken) return;
    const input = prompt('Nhập link lời mời hoặc Token kết bạn:');
    if (!input) return;

    let token = input.trim();
    if (token.includes('token=')) {
      token = token.split('token=')[1].split('&')[0];
    }

    try {
      const res = await acceptInvite(accessToken, token);
      toast.success('Đã chấp nhận lời mời kết bạn thành công!');
      const updatedUsers = await loadUsers(accessToken);
      if (res?.senderId) {
        setActiveReceiverId(res.senderId, accessToken);
      }
    } catch (error: any) {
      console.error('Failed to accept invite:', error);
      toast.error(error?.message || 'Không thể chấp nhận lời mời kết bạn');
    }
  };

  const activeChatPartner = users.find(u => u.id === activeReceiverId);
  const partnerStatus = getUserStatusText(activeChatPartner?.isOnline, activeChatPartner?.lastSeen);

  return (
    <MainContainer className="h-[100dvh] max-h-[100dvh] overflow-hidden !pb-[100px] flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2 shrink-0">
        <h1 className="text-2xl font-bold text-white shadow-text">{t('title')}</h1>
      </header>

      <div className="flex-1 min-h-0 glass-dark rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar - User List */}
        <aside className={cn(
          "w-full md:w-80 md:border-r border-white/10 p-4 overflow-y-auto flex-col shrink-0 h-full",
          activeReceiverId ? "hidden md:flex" : "flex flex-1"
        )}>
          <UserList 
            users={users} 
            activeUserId={activeReceiverId} 
            unreadUserIds={unreadMessages}
            onSelectUser={handleSelectUser} 
          />
          {users.length === 0 && (
            <div className="text-white/40 text-sm text-center py-8">
              {t('no_conversations')}
            </div>
          )}
        </aside>

        {/* Main Chat Area */}
        <section className={cn(
          "flex-1 flex flex-col h-full overflow-hidden min-w-0 min-h-0",
          activeReceiverId ? "flex" : "hidden md:flex"
        )}>
          {activeReceiverId ? (
            <>
              {/* Chat Header */}
              <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button 
                    onClick={() => handleSelectUser(null)}
                    className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors text-white md:hidden shrink-0"
                    title="Back to list"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold truncate text-sm sm:text-base">
                      {activeChatPartner?.name || activeChatPartner?.email}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[11px] min-w-0 mt-0.5">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", partnerStatus.isOnline ? "bg-emerald-400 animate-pulse" : "bg-white/30")} />
                      <span className={cn("font-medium", partnerStatus.isOnline ? "text-emerald-400" : "text-white/50")}>
                        {partnerStatus.text}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-white/40 truncate">{activeChatPartner?.email}</span>
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
                  currentUserId={currentUser?.id || ''} 
                  onLoadMore={() => accessToken && loadMoreMessages(accessToken)}
                  hasMore={hasMoreMessages}
                  isLoadingMore={isLoadingMore}
                  onAcceptInvite={handleAcceptInvite}
                  onCreateInvite={handleCreateInvite}
                />
              )}
              <ChatInput onSend={handleSend} />
            </>
          ) : (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Chưa chọn cuộc trò chuyện
              </h3>
              <p className="text-xs text-white/50 max-w-xs mb-6">
                Chọn một người bạn từ danh sách hoặc nhận/gửi lời mời để bắt đầu nhắn tin!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleAcceptInvite}
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Nhận lời mời
                </Button>
                <Button
                  onClick={handleCreateInvite}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Link2 className="w-4 h-4" />
                  {t('invite_button')}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainContainer>
  );
}
