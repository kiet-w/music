'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type User = {
  id: string;
  name: string;
  email: string;
};

interface UserListProps {
  users: User[];
  activeUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function UserList({ users, activeUserId, onSelectUser }: UserListProps) {
  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left",
            activeUserId === user.id 
              ? "glass-light text-white shadow-soft" 
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold text-white border border-white/10">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.name || user.email}</p>
            <p className="text-[10px] opacity-40 truncate">{user.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
