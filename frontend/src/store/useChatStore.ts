'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { fetchChatHistory, sendMessage as apiSendMessage } from '@/lib/api';

export type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
};

type ChatState = {
  messages: Message[];
  activeReceiverId: string | null;
  unreadMessages: string[]; // Array of senderIds with unread messages
  isSubscribed: boolean;
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearUnread: (senderId: string) => void;
  setActiveReceiverId: (id: string | null, token?: string) => Promise<void>;
  sendMessage: (token: string, content: string) => Promise<void>;
  subscribeToMessages: (userId: string) => void;
  unsubscribeFromMessages: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeReceiverId: null,
  unreadMessages: [],
  isSubscribed: false,
  isLoading: false,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    // Avoid duplicates
    const exists = get().messages.some(m => m.id === message.id);
    if (exists) return;

    set((state) => {
      const isFromActiveChat = state.activeReceiverId === message.senderId;
      const isFromMe = state.activeReceiverId === message.receiverId; 
      
      const newState: Partial<ChatState> = {
        messages: [...state.messages, message]
      };

      // If message is for us (receiverId matches our ID which is handled by filter in subscription)
      // and it's NOT from the person we are currently talking to, mark as unread
      if (!isFromActiveChat && message.senderId !== state.activeReceiverId) {
        if (!state.unreadMessages.includes(message.senderId)) {
          newState.unreadMessages = [...state.unreadMessages, message.senderId];
        }
      }

      return newState;
    });
  },

  clearUnread: (senderId) => set((state) => ({
    unreadMessages: state.unreadMessages.filter(id => id !== senderId)
  })),

  setActiveReceiverId: async (id, token) => {
    set({ activeReceiverId: id, messages: [] });
    if (id) {
      get().clearUnread(id);
    }
    if (id && token) {
      set({ isLoading: true });
      try {
        const history = await fetchChatHistory(token, id);
        set({ messages: history });
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        set({ isLoading: false });
      }
    }
  },

  sendMessage: async (token, content) => {
    const receiverId = get().activeReceiverId;
    if (!receiverId) return;

    try {
      const newMessage = await apiSendMessage(token, receiverId, content);
      get().addMessage(newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  subscribeToMessages: (userId: string) => {
    if (get().isSubscribed) return;

    const channel = supabase
      .channel(`chat:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `receiverId=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          get().addMessage(newMessage);
        }
      )
      .subscribe();

    set({ isSubscribed: true });
  },

  unsubscribeFromMessages: () => {
    supabase.removeAllChannels();
    set({ isSubscribed: false });
  },
}));
