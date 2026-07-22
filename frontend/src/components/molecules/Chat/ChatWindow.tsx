'use client';

import React, { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ChatWindow({
  messages,
  currentUserId,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMore || !hasMore || !onLoadMore) return;
    if (el.scrollTop <= 50) {
      // ponytail: capture height here (sync), before the async fetch mutates DOM
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Restore scroll position after prepend so user's reading position stays stable
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isPrependingRef.current && messages.length > prevMessagesLengthRef.current) {
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop = delta;
      isPrependingRef.current = false;
    } else if (!isPrependingRef.current && messages.length > prevMessagesLengthRef.current) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (prevMessagesLengthRef.current === 0 || isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 scrollbar-hide"
    >
      {/* Top Status Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-2 shrink-0">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="text-center text-xs text-white/30 py-2 italic shrink-0">
          Đầu cuộc trò chuyện
        </div>
      )}

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
