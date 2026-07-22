'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
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
  unreadMessages: string[];
  isSubscribed: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  socket: Socket | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearUnread: (senderId: string) => void;
  setActiveReceiverId: (id: string | null, token?: string) => Promise<void>;
  loadMoreMessages: (token: string) => Promise<boolean>;
  sendMessage: (token: string, content: string) => Promise<void>;
  subscribeToMessages: (userId: string) => void;
  unsubscribeFromMessages: () => void;
};

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeReceiverId: null,
  unreadMessages: [],
  isSubscribed: false,
  isLoading: false,
  isLoadingMore: false,
  hasMoreMessages: true,
  socket: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    const exists = get().messages.some(m => m.id === message.id);
    if (exists) return;

    set((state) => {
      const isFromActiveChat =
        state.activeReceiverId === message.senderId ||
        state.activeReceiverId === message.receiverId;
      const newState: Partial<ChatState> = {
        messages: [...state.messages, message],
      };
      if (!isFromActiveChat && !state.unreadMessages.includes(message.senderId)) {
        newState.unreadMessages = [...state.unreadMessages, message.senderId];
      }
      return newState;
    });
  },

  clearUnread: (senderId) => set((state) => ({
    unreadMessages: state.unreadMessages.filter(id => id !== senderId),
  })),

  setActiveReceiverId: async (id, token) => {
    set({ activeReceiverId: id, messages: [], hasMoreMessages: true, isLoadingMore: false });
    if (id) get().clearUnread(id);
    if (id && token) {
      set({ isLoading: true });
      try {
        const history = await fetchChatHistory(token, id, undefined, 30);
        set({ messages: history, hasMoreMessages: history.length >= 30 });
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
        set({ messages: [] });
      } finally {
        set({ isLoading: false });
      }
    }
  },

  loadMoreMessages: async (token) => {
    const state = get();
    if (!state.activeReceiverId || !state.hasMoreMessages || state.isLoadingMore || state.messages.length === 0) {
      return false;
    }
    set({ isLoadingMore: true });
    try {
      const cursor = state.messages[0].createdAt;
      const older = await fetchChatHistory(token, state.activeReceiverId, cursor, 30);
      if (!older || older.length === 0) {
        set({ hasMoreMessages: false });
        return false;
      }
      const existingIds = new Set(state.messages.map(m => m.id));
      const unique = older.filter(m => !existingIds.has(m.id));
      if (unique.length === 0) {
        set({ hasMoreMessages: false });
        return false;
      }
      set((s) => ({
        messages: [...unique, ...s.messages],
        hasMoreMessages: older.length >= 30,
      }));
      return true;
    } catch (error) {
      console.error('Failed to load more messages:', error);
      return false;
    } finally {
      set({ isLoadingMore: false });
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
    // ponytail: allow re-subscribe after disconnect by checking socket state, not just flag
    const existing = get().socket;
    if (existing?.connected && get().isSubscribed) return;
    if (existing) {
      existing.disconnect();
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected, joining room for user:', userId);
      socket.emit('joinUserRoom', userId);
    });

    // Re-join room on reconnect (fixes the reconnect bug)
    socket.on('reconnect', () => {
      console.log('[Socket.io] Reconnected, re-joining room for user:', userId);
      socket.emit('joinUserRoom', userId);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message);
    });

    socket.on('newMessage', (message: Message) => {
      get().addMessage(message);
    });

    set({ isSubscribed: true, socket });
  },

  unsubscribeFromMessages: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ isSubscribed: false, socket: null });
  },
}));
