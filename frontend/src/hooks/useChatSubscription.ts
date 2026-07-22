'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export function useChatSubscription() {
  const { user } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      subscribeToMessages(user.id);
    }
    return () => unsubscribeFromMessages();
  }, [user?.id, subscribeToMessages, unsubscribeFromMessages]);
}
