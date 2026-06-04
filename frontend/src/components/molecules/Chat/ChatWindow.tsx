'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
}

export function ChatWindow({ messages, currentUserId }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 scrollbar-hide"
    >
      {messages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        return (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] flex flex-col gap-1",
              isMe ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={cn(
                "px-4 py-2 rounded-2xl text-sm break-words shadow-soft",
                isMe 
                  ? "bg-white text-black rounded-tr-none" 
                  : "glass-light text-white rounded-tl-none border border-white/10"
              )}
            >
              {msg.content}
            </div>
            <span className="text-[10px] text-white/30 px-1">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
