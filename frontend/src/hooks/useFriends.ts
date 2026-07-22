'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { User } from '@/components/molecules/Chat/UserList';
import { fetchFriends } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export function useFriends() {
  const t = useTranslations('Chat');
  const { user: currentUser, accessToken } = useAuthStore();
  const { socket } = useChatStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setTicker] = useState<number>(0);

  // Periodic ticker to refresh relative time strings (e.g. 5 phút -> 1 giờ)
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadUsers = useCallback(
    async (token: string) => {
      setIsLoading(true);
      try {
        const data = await fetchFriends(token);
        const filteredUsers = data.filter((u: User) => u.id !== currentUser?.id);
        setUsers(filteredUsers);
        return filteredUsers;
      } catch (err) {
        console.error('Failed to fetch friends:', err);
        toast.error(t('error_loading_users') || 'Failed to load friends');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser?.id, t]
  );

  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Listen for realtime presence and friend request acceptance updates from socket
  useEffect(() => {
    if (!socket) return;

    const handlePresence = (data: { userId: string; isOnline: boolean; lastSeen: string | null }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.userId
            ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : user
        )
      );
    };

    const handleFriendAccepted = () => {
      const currentToken = accessTokenRef.current;
      if (currentToken) {
        void loadUsers(currentToken);
        toast.success('🎉 Bạn vừa kết bạn mới thành công!');
      }
    };

    socket.on('userPresenceChanged', handlePresence);
    socket.on('friendRequestAccepted', handleFriendAccepted);

    return () => {
      socket.off('userPresenceChanged', handlePresence);
      socket.off('friendRequestAccepted', handleFriendAccepted);
    };
  }, [socket, loadUsers]);

  return {
    users,
    setUsers,
    loadUsers,
    currentUser,
    accessToken,
    isLoading,
  };
}
