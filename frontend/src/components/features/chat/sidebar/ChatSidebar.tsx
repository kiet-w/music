'use client';

import React from 'react';
import { UserList, User } from '@/components/features/chat/sidebar/UserList';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  users: User[];
  activeReceiverId: string | null;
  unreadMessages: Record<string, boolean> | string[];
  onSelectUser: (userId: string | null) => void;
  showBorder?: boolean;
}

// ponytail: chat sidebar component with optional column divider border
export function ChatSidebar({
  users,
  activeReceiverId,
  unreadMessages,
  onSelectUser,
  showBorder = false,
}: ChatSidebarProps) {
  const unreadList = Array.isArray(unreadMessages)
    ? unreadMessages
    : Object.keys(unreadMessages).filter(id => unreadMessages[id]);

  return (
    <aside
      className={cn(
        'w-full lg:w-80 p-4 overflow-y-auto flex-col shrink-0 h-full',
        showBorder && 'lg:border-r border-white/10',
        activeReceiverId ? 'hidden lg:flex' : 'flex flex-1'
      )}
    >
      <UserList
        users={users}
        activeUserId={activeReceiverId}
        unreadUserIds={unreadList}
        onSelectUser={onSelectUser}
      />
    </aside>
  );
}
