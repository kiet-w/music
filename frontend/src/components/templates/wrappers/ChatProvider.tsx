'use client';

import React from 'react';
import { useChatSubscription } from '@/hooks/useChatSubscription';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  useChatSubscription();

  return <>{children}</>;
}

