'use client';

import React, { useLayoutEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';
import { User } from '@/components/molecules/Chat/UserList';
import { Button } from '@/components/atoms/ui/button';
import { UserPlus, Link2, MessageSquare, User as UserIcon } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  partner?: User;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onAcceptInvite?: () => void;
  onCreateInvite?: () => void;
}

export function ChatWindow({
  messages,
  currentUserId,
  partner,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onAcceptInvite,
  onCreateInvite,
}: ChatWindowProps) {
  const t = useTranslations('Chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMore || !hasMore || !onLoadMore) return;
    if (el.scrollTop <= 50) {
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
      className={cn(
        "flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 scrollbar-hide",
        messages.length === 0 && "justify-center items-center"
      )}
    >
      {/* Top Status Indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-2 shrink-0">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="text-center text-xs text-white/30 py-2 italic shrink-0">
          {t('top_of_chat')}
        </div>
      )}

      {/* Empty Messages State with Centered Action Buttons */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {t('no_messages_title')}
          </h3>
          <p className="text-xs text-white/50 max-w-xs mb-6">
            {t('no_messages_desc')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onAcceptInvite && (
              <Button
                onClick={onAcceptInvite}
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {t('accept_invite_btn')}
              </Button>
            )}
            {onCreateInvite && (
              <Button
                onClick={onCreateInvite}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Link2 className="w-4 h-4" />
                {t('invite_button')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Render Message List when messages exist */}
      {messages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        const partnerInitial = partner?.name?.[0]?.toUpperCase() || partner?.email?.[0]?.toUpperCase();

        return (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] sm:max-w-[80%] flex gap-2.5",
              isMe ? "self-end flex-row-reverse" : "self-start flex-row"
            )}
          >
            {!isMe && (
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold text-xs text-white border border-white/10 shrink-0 self-start mt-0.5 shadow-sm select-none"
                title={partner?.name || partner?.email || 'User'}
              >
                {partnerInitial ? (
                  partnerInitial
                ) : (
                  <UserIcon className="w-4 h-4 text-white/70" />
                )}
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-1 min-w-0",
                isMe ? "items-end" : "items-start"
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
          </div>
        );
      })}
    </div>
  );
}
