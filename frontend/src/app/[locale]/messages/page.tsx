'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { UserList, User } from '@/components/molecules/Chat/UserList';
import { ChatWindow } from '@/components/molecules/Chat/ChatWindow';
import { ChatInput } from '@/components/molecules/Chat/ChatInput';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchUsers } from '@/lib/api';

export default function MessagesPage() {
  const t = useTranslations('Chat');
  const { user: currentUser, accessToken } = useAuthStore();
  const { 
    messages, 
    activeReceiverId, 
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
        setUsers(data.filter((u: User) => u.id !== currentUser?.id));
      });
    }
  }, [accessToken, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      subscribeToMessages(currentUser.id);
    }
    return () => unsubscribeFromMessages();
  }, [currentUser?.id, subscribeToMessages, unsubscribeFromMessages]);

  const handleSelectUser = (userId: string) => {
    if (accessToken) {
      setActiveReceiverId(userId, accessToken);
    }
  };

  const handleSend = async (content: string) => {
    if (!accessToken) return;
    try {
      await sendMessage(accessToken, content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const activeChatPartner = users.find(u => u.id === activeReceiverId);

  return (
    <main className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-6xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white shadow-text">{t('title')}</h1>
      </header>

      <div className="flex-1 glass-dark rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row h-[70vh] min-h-[500px]">
        {/* Sidebar - User List */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 p-4 overflow-y-auto">
          <UserList 
            users={users} 
            activeUserId={activeReceiverId} 
            onSelectUser={handleSelectUser} 
          />
          {users.length === 0 && (
            <div className="text-white/40 text-sm text-center py-8">
              {t('no_conversations')}
            </div>
          )}
        </aside>

        {/* Main Chat Area */}
        <section className="flex-1 flex flex-col h-full overflow-hidden">
          {activeReceiverId ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <h2 className="text-white font-bold">{activeChatPartner?.name || activeChatPartner?.email}</h2>
                  <p className="text-[10px] text-white/40">{activeChatPartner?.email}</p>
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
    </main>
  );
}
