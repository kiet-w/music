
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
type User = any;
import { fetchFriends } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export function useFriends() {
  const t = (key: string) => key;
  const { user: currentUser, accessToken, isHydrated } = useAuthStore();
  const { socket } = useChatStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isHydrated && !accessToken) {
      setIsLoading(false);
    }
  }, [isHydrated, accessToken]);

  // ponytail: removed 30s setInterval ticker — was re-rendering entire friends list every 30s just for relative time strings

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
        Alert.alert('error_loading_users');
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
        Alert.alert('🎉 Bạn vừa kết bạn mới thành công!');
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
