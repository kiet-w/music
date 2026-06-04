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
  isSubscribed: boolean;
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveReceiverId: (id: string | null, token?: string) => Promise<void>;
  sendMessage: (token: string, content: string) => Promise<void>;
  subscribeToMessages: (userId: string) => void;
  unsubscribeFromMessages: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeReceiverId: null,
  isSubscribed: false,
  isLoading: false,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    // Avoid duplicates (e.g. from optimistic update and realtime event)
    const exists = get().messages.some(m => m.id === message.id);
    if (!exists) {
      set((state) => ({ messages: [...state.messages, message] }));
    }
  },

  setActiveReceiverId: async (id, token) => {
    set({ activeReceiverId: id, messages: [] });
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
          // Add message if it's from current chat partner or handle global notifications
          if (get().activeReceiverId === newMessage.senderId) {
            get().addMessage(newMessage);
          }
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
