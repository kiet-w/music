'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      subscribeToMessages(user.id);
    }
    return () => unsubscribeFromMessages();
  }, [user?.id, subscribeToMessages, unsubscribeFromMessages]);

  return <>{children}</>;
}
