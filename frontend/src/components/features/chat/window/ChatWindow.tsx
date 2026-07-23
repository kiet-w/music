'use client';

import React, { useLayoutEffect, useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';
import { User } from '@/components/features/chat/sidebar/UserList';
import { Button } from '@/components/ui/button';
import { UserPlus, Link2, MessageSquare, User as UserIcon, Smile } from 'lucide-react';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { ReactionPicker } from '@/components/features/chat/input/ReactionPicker';

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  partner?: User;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onAcceptInvite?: () => void;
  onCreateInvite?: () => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
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
  onReactToMessage,
}: ChatWindowProps) {
  const t = useTranslations('Chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const isKeyboardVisible = useKeyboardVisible();
  const keyboardHeight = useKeyboardHeight();
  const [activePickerMessageId, setActivePickerMessageId] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // Re-scroll to bottom instantly when keyboard opens/closes or viewport resizes
  useEffect(() => {
    scrollToBottom();
    requestAnimationFrame(scrollToBottom);
  }, [isKeyboardVisible, keyboardHeight, scrollToBottom]);

  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMore || !hasMore || !onLoadMore) return;
    if (el.scrollTop <= 50) {
      prevScrollHeightRef.current = el.scrollHeight;
      isPrependingRef.current = true;
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Restore scroll position after prepend or scroll to bottom for new messages
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isPrependingRef.current && messages.length > prevMessagesLengthRef.current) {
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop = delta;
      isPrependingRef.current = false;
    } else {
      el.scrollTop = el.scrollHeight;
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
      {messages.length > 0 && (
        <div className="flex flex-col gap-4 mt-auto w-full">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const partnerInitial = partner?.name?.[0]?.toUpperCase() || partner?.email?.[0]?.toUpperCase();
            const isPickerOpen = activePickerMessageId === msg.id;

            // Group reactions by emoji
            const reactionMap = new Map<string, { emoji: string; count: number; hasReacted: boolean }>();
            if (msg.reactions) {
              for (const r of msg.reactions) {
                const existing = reactionMap.get(r.emoji) || { emoji: r.emoji, count: 0, hasReacted: false };
                existing.count += 1;
                if (r.userId === currentUserId) {
                  existing.hasReacted = true;
                }
                reactionMap.set(r.emoji, existing);
              }
            }
            const groupedReactions = Array.from(reactionMap.values());
            const myReaction = msg.reactions?.find((r) => r.userId === currentUserId)?.emoji;
            const hasReactions = groupedReactions.length > 0;

            return (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] sm:max-w-[80%] flex gap-2.5 group relative",
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
                    "flex flex-col gap-1 min-w-0 relative",
                    isMe ? "items-end" : "items-start"
                  )}
                >
                  {/* Reaction Picker Popover */}
                  {isPickerOpen && (
                    <ReactionPicker
                      currentReaction={myReaction}
                      isMe={isMe}
                      onSelectEmoji={(emoji) => {
                        if (onReactToMessage) {
                          onReactToMessage(msg.id, emoji);
                        }
                      }}
                      onClose={() => setActivePickerMessageId(null)}
                    />
                  )}

                  {/* Message Bubble + Hover Trigger Container */}
                  <div className="relative group/bubble flex items-center gap-1.5 max-w-full">
                    {/* Reaction trigger button (appears on hover or active) */}
                    <button
                      type="button"
                      onClick={() => setActivePickerMessageId(isPickerOpen ? null : msg.id)}
                      className={cn(
                        "p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 shrink-0",
                        isPickerOpen && "opacity-100 bg-white/10 text-emerald-400",
                        isMe ? "order-first" : "order-last"
                      )}
                      title="Bày tỏ cảm xúc"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Content Box */}
                    <div
                      className={cn(
                        "px-4 py-2 rounded-2xl text-sm break-words shadow-soft relative transition-all",
                        isMe
                          ? "bg-white text-black rounded-tr-none"
                          : "glass-light text-white rounded-tl-none border border-white/10",
                        hasReactions && "mb-3.5"
                      )}
                    >
                      {msg.content}

                      {/* Display Reaction Badges floating at bottom of bubble */}
                      {hasReactions && (
                        <div
                          className={cn(
                            "absolute -bottom-3.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-950/95 border border-white/15 backdrop-blur-md shadow-xl text-xs z-10 select-none cursor-pointer hover:scale-105 transition-all",
                            isMe ? "right-2" : "left-2"
                          )}
                        >
                          {groupedReactions.map((gr) => (
                            <button
                              key={gr.emoji}
                              type="button"
                              onClick={() => {
                                if (onReactToMessage) {
                                  onReactToMessage(msg.id, gr.emoji);
                                }
                              }}
                              className="flex items-center gap-1 px-1 py-0.5 rounded-full transition-all outline-none focus:outline-none focus:ring-0 bg-transparent hover:opacity-80"
                              title={gr.hasReacted ? "Bạn đã thả cảm xúc này (bấm để gỡ)" : "Bày tỏ cảm xúc này"}
                            >
                              <span className="text-sm leading-none">{gr.emoji}</span>
                              {gr.count > 1 && (
                                <span className="text-[10px] text-white/80 font-semibold leading-none">{gr.count}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-white/30 px-1 mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
