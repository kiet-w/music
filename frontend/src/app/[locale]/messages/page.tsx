'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { UserList, User } from '@/components/molecules/Chat/UserList';
import { ChatWindow } from '@/components/molecules/Chat/ChatWindow';
import { ChatInput } from '@/components/molecules/Chat/ChatInput';
import { Button } from '@/components/atoms/ui/button';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchUsers, createInvite } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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
    isLoading 
  } = useChatStore();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (accessToken) {
      fetchUsers(accessToken).then(data => {
        // Filter out the current user from the list
        const filteredUsers = data.filter((u: User) => u.id !== currentUser?.id);
        setUsers(filteredUsers);

        // If targetUserId is provided in URL, set it as active
        if (targetUserId && filteredUsers.some((u: User) => u.id === targetUserId)) {
          setActiveReceiverId(targetUserId, accessToken);
        }
      }).catch((err) => {
        console.error('Failed to fetch users:', err);
        toast.error(t('error_loading_users') || 'Failed to load users');
      });
    }
  }, [accessToken, currentUser?.id, targetUserId, setActiveReceiverId]);

  useEffect(() => {
    if (currentUser?.id) {
      subscribeToMessages(currentUser.id);
    }
    return () => unsubscribeFromMessages();
  }, [currentUser?.id, subscribeToMessages, unsubscribeFromMessages]);

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
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(t('error_send_message') || 'Failed to send message');
    }
  };

  const handleCreateInvite = async () => {
    if (!accessToken) return;
    try {
      const { token } = await createInvite(accessToken);
      const inviteUrl = `${window.location.origin}/${searchParams.get('locale')}/invite?token=${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('invite_success_copied') || 'Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to create invite:', error);
      toast.error(t('error_create_invite') || 'Failed to create invite link');
    }
  };

  const activeChatPartner = users.find(u => u.id === activeReceiverId);

  return (
    <MainContainer className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white shadow-text">{t('title')}</h1>
        <Button 
          onClick={handleCreateInvite}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl"
        >
          {t('invite_button')}
        </Button>
      </header>

      <div className="flex-1 glass-dark rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[70vh] min-h-[500px]">
        {/* Sidebar - User List */}
        <aside className={cn(
          "w-full border-b border-white/10 p-4 overflow-y-auto",
          activeReceiverId ? "hidden" : "block"
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
          "flex-1 flex flex-col h-full overflow-hidden",
          activeReceiverId ? "block" : "hidden"
        )}>
          {activeReceiverId ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSelectUser(null)}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-white font-bold">{activeChatPartner?.name || activeChatPartner?.email}</h2>
                    <p className="text-[10px] text-white/40">{activeChatPartner?.email}</p>
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
                />
              )}
              <ChatInput onSend={handleSend} />
            </>
          ) : (
            <div className="flex-1 p-6 flex items-center justify-center text-white/40 italic">
              {t('select_user')}
            </div>
          )}
        </section>
      </div>
    </MainContainer>
  );
}
