'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getUserStatusText } from '@/lib/userStatus';

export type User = {
  id: string;
  name: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string | null;
};

interface UserListProps {
  users: User[];
  activeUserId: string | null;
  unreadUserIds?: string[];
  onSelectUser: (userId: string) => void;
}

export const UserList = React.memo(function UserList({ users, activeUserId, unreadUserIds = [], onSelectUser }: UserListProps) {
  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => {
        const isUnread = unreadUserIds.includes(user.id);
        const status = getUserStatusText(user.isOnline, user.lastSeen);
        
        return (
          <button
            key={user.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSelectUser(user.id);
            }}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left relative cursor-pointer select-none",
              activeUserId === user.id 
                ? "glass-light text-white shadow-soft ring-1 ring-white/20 bg-white/10" 
                : "text-white/60 hover:text-white hover:bg-white/5 active:scale-[0.98]"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold text-white border border-white/10 relative shrink-0">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              {isUnread ? (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#121212] shadow-sm animate-pulse" />
              ) : (
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121212]",
                    status.isOnline ? "bg-white" : "bg-white/20"
                  )} 
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold truncate text-sm", isUnread && "text-white")}>
                {user.name || user.email}
              </p>
              <p className={cn("text-[11px] truncate", status.isOnline ? "text-white font-medium" : "text-white/40")}>
                {status.text}
              </p>
            </div>
            {isUnread && (
              <div className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                NEW
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});
