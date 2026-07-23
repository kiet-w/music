'use client';

import React, { useLayoutEffect, useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Message } from '@/store/useChatStore';
import { User } from '@/components/features/chat/sidebar/UserList';
import { Button } from '@/components/ui/button';
import { UserPlus, Link2, MessageSquare, User as UserIcon, Smile, Play, Pause, Disc, Music } from 'lucide-react';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { ReactionPicker } from '@/components/features/chat/input/ReactionPicker';
import { usePlayerStore } from '@/store/usePlayerStore';

interface SharedSongData {
  title: string;
  artist?: string;
  url: string;
  coverUrl?: string;
}

function parseSongShare(content: string): SharedSongData | null {
  if (!content) return null;

  // 1. JSON format
  if (content.startsWith('{') && content.includes('"type":"song_share"')) {
    try {
      const data = JSON.parse(content);
      if (data.type === 'song_share' && data.url) {
        return {
          title: data.title || 'Bài hát được chia sẻ',
          artist: data.artist || 'Nghệ sĩ',
          url: data.url,
          coverUrl: data.coverUrl || undefined,
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Structured text format: 🎵 [SONG] Title | Artist | URL | CoverURL
  if (content.includes('🎵 [SONG]')) {
    const parts = content.replace('🎵 [SONG]', '').split('|').map((s) => s.trim());
    if (parts.length >= 3) {
      return {
        title: parts[0],
        artist: parts[1],
        url: parts[2],
        coverUrl: parts[3] || undefined,
      };
    }
  }

  // 3. Audio URL format (e.g. .mp3, .m4a, soundhelix, etc.)
  const urlRegex = /(https?:\/\/[^\s]+\.(mp3|m4a|wav|aac|ogg)(\?[^\s]*)?)/i;
  const match = content.match(urlRegex);
  if (match) {
    return {
      title: 'Bài hát Audio',
      artist: 'Chia sẻ từ bạn bè',
      url: match[0],
    };
  }

  return null;
}

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

  const mainIsPlaying = usePlayerStore((s) => s.isPlaying);
  const mainPause = usePlayerStore((s) => s.pause);

  const [activeMessageAudio, setActiveMessageAudio] = useState<{
    msgId: string;
    url: string;
    isPlaying: boolean;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pause message audio if main player outside starts playing
  useEffect(() => {
    if (mainIsPlaying && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setActiveMessageAudio((prev) => (prev ? { ...prev, isPlaying: false } : null));
    }
  }, [mainIsPlaying]);

  // Clean up message audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggleMessageSong = useCallback((msgId: string, url: string) => {
    if (audioRef.current && activeMessageAudio?.msgId === msgId) {
      if (activeMessageAudio.isPlaying) {
        audioRef.current.pause();
        setActiveMessageAudio({ msgId, url, isPlaying: false });
      } else {
        if (usePlayerStore.getState().isPlaying) {
          mainPause();
        }
        audioRef.current.play().then(() => {
          setActiveMessageAudio({ msgId, url, isPlaying: true });
        }).catch((err) => {
          console.error("Failed to play message audio:", err);
          setActiveMessageAudio(null);
        });
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (usePlayerStore.getState().isPlaying) {
      mainPause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setActiveMessageAudio((prev) => (prev?.msgId === msgId ? { ...prev, isPlaying: false } : prev));
    };
    audio.onerror = () => {
      setActiveMessageAudio((prev) => (prev?.msgId === msgId ? { ...prev, isPlaying: false } : prev));
    };

    audio.play().then(() => {
      setActiveMessageAudio({ msgId, url, isPlaying: true });
    }).catch((err) => {
      console.error("Failed to play message audio:", err);
      setActiveMessageAudio(null);
    });
  }, [activeMessageAudio, mainPause]);

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
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative flex flex-col min-h-0"
    >
      {/* Loading Indicator for Pagination */}
      {isLoadingMore && (
        <div className="flex justify-center py-2 shrink-0">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        </div>
      )}

      {/* Empty Chat State Placeholder */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white shadow-lg shadow-white/5">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {t('no_messages_title') || 'Chưa có tin nhắn nào'}
          </h3>
          <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-6">
            {t('no_messages_desc') || 'Hãy gửi lời chào hoặc mã kết bạn để bắt đầu trò chuyện ngay!'}
          </p>

          {/* Direct Action Buttons for Quick Connection */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onAcceptInvite && (
              <Button
                type="button"
                onClick={onAcceptInvite}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('accept_friend_invite') || 'Chấp nhận kết bạn'}</span>
              </Button>
            )}

            {onCreateInvite && (
              <Button
                type="button"
                onClick={onCreateInvite}
                className="bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl text-xs px-4 py-2.5 h-10 flex items-center gap-2 shadow-lg"
              >
                <Link2 className="w-4 h-4" />
                <span>{t('create_friend_code') || 'Tạo mã bạn bè'}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Render Message List */}
      {messages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        const isPickerOpen = activePickerMessageId === msg.id;
        const partnerInitial = partner?.name?.charAt(0).toUpperCase() || partner?.email?.charAt(0).toUpperCase();

        // Group reactions by emoji
        const groupedReactionsMap = new Map<string, { emoji: string; count: number; hasReacted: boolean }>();
        if (msg.reactions && msg.reactions.length > 0) {
          msg.reactions.forEach((r) => {
            const existing = groupedReactionsMap.get(r.emoji);
            const isMyEmoji = r.userId === currentUserId;
            if (existing) {
              existing.count += 1;
              if (isMyEmoji) existing.hasReacted = true;
            } else {
              groupedReactionsMap.set(r.emoji, { emoji: r.emoji, count: 1, hasReacted: isMyEmoji });
            }
          });
        }
        const groupedReactions = Array.from(groupedReactionsMap.values());
        const myReaction = msg.reactions?.find((r) => r.userId === currentUserId)?.emoji;
        const hasReactions = groupedReactions.length > 0;

        const songShare = parseSongShare(msg.content);
        const isThisSongPlaying = activeMessageAudio?.msgId === msg.id && activeMessageAudio.isPlaying;

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
                {/* Reaction trigger button */}
                <button
                  type="button"
                  onClick={() => setActivePickerMessageId(isPickerOpen ? null : msg.id)}
                  className={cn(
                    "p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 shrink-0",
                    isPickerOpen && "opacity-100 bg-white/10 text-white",
                    isMe ? "order-first" : "order-last"
                  )}
                  title="Bày tỏ cảm xúc"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Content Box or Music Card */}
                {songShare ? (
                  <div
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex flex-col gap-2 min-w-[240px] sm:min-w-[280px] shadow-lg relative",
                      isMe
                        ? "bg-white text-zinc-950 border-white rounded-tr-none"
                        : "bg-zinc-900 text-white border-white/20 rounded-tl-none",
                      hasReactions && "mb-3.5"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider border-b pb-1.5",
                      isMe ? "text-zinc-500 border-zinc-200" : "text-zinc-400 border-white/10"
                    )}>
                      <div className="flex items-center gap-1.5">
                        <Music size={12} />
                        <span>Bài Hát Đang Chia Sẻ</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl shrink-0 overflow-hidden relative border flex items-center justify-center",
                        isMe ? "bg-zinc-100 border-zinc-300 text-zinc-600" : "bg-zinc-800 border-white/10 text-white/40"
                      )}>
                        {songShare.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={songShare.coverUrl} alt={songShare.title} className="w-full h-full object-cover" />
                        ) : (
                          <Disc size={22} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm truncate leading-tight">{songShare.title}</h4>
                        <p className={cn("text-[11px] truncate mt-0.5", isMe ? "text-zinc-600 font-medium" : "text-zinc-400")}>
                          {songShare.artist || 'Nghệ sĩ'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleMessageSong(msg.id, songShare.url)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-transform active:scale-95",
                          isMe ? "bg-zinc-950 text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
                        )}
                        title={isThisSongPlaying ? "Tạm dừng bài hát" : "Phát bài hát này trong tin nhắn"}
                      >
                        {isThisSongPlaying ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Display Reaction Badges */}
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
                            className="flex items-center gap-1 px-1 py-0.5 rounded-full transition-all outline-none focus:outline-none focus:ring-0 bg-transparent hover:opacity-80 text-white"
                            title={gr.hasReacted ? "Bạn đã thả cảm xúc này" : "Bày tỏ cảm xúc này"}
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
                ) : (
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

                    {/* Display Reaction Badges */}
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
                            className="flex items-center gap-1 px-1 py-0.5 rounded-full transition-all outline-none focus:outline-none focus:ring-0 bg-transparent hover:opacity-80 text-white"
                            title={gr.hasReacted ? "Bạn đã thả cảm xúc này" : "Bày tỏ cảm xúc này"}
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
                )}
              </div>

              <span className="text-[10px] text-white/30 px-1 mt-0.5">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
