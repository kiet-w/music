'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Music, Disc, Copy, Check, User as UserIcon, Plus } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { sendMessage as apiSendMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ShareTrackModalProps {
  track: {
    id: string;
    title: string;
    artist?: string | null;
    url?: string;
    coverUrl?: string | null;
    cover?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTrackModal({ track, isOpen, onClose }: ShareTrackModalProps) {
  const { users: friends, isLoading, loadUsers } = useFriends();
  const { accessToken } = useAuthStore();
  const { addMessage, setActiveReceiverId } = useChatStore();
  const { addToQueue } = usePlayerStore();

  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadUsers(accessToken);
    }
  }, [isOpen, accessToken, loadUsers]);

  if (!isOpen || !track) return null;

  const displayCover = track.coverUrl || track.cover;
  const trackUrl = track.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  const handleSendToFriend = async (friendId?: string) => {
    const targetFriendId = friendId || selectedFriendId;
    if (!targetFriendId || !accessToken || isSending) return;

    const selectedFriend = friends.find((f) => f.id === targetFriendId);
    const friendName = selectedFriend?.name || selectedFriend?.email || 'Bạn bè';

    setIsSending(true);
    try {
      const payload = JSON.stringify({
        type: 'song_share',
        title: track.title,
        artist: track.artist || 'Nghệ sĩ',
        url: trackUrl,
        coverUrl: displayCover || '',
      });

      const newMessage = await apiSendMessage(accessToken, targetFriendId, payload);
      if (newMessage) {
        addMessage(newMessage);
      }

      await setActiveReceiverId(targetFriendId, accessToken);

      toast.success(`Đã gửi bài hát "${track.title}" cho ${friendName}!`);
      onClose();
    } catch (err) {
      console.error('Failed to send song in message:', err);
      toast.error('Không thể gửi bài hát lúc này. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    const textToCopy = `🎵 ${track.title} - ${track.artist || 'Nghệ sĩ'} ${trackUrl ? `| ${trackUrl}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Đã sao chép liên kết chia sẻ!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToQueue = () => {
    const trackToQueue: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist || null,
      coverUrl: displayCover || undefined,
      url: trackUrl,
    };
    addToQueue(trackToQueue);
    toast.success(`Đã thêm "${track.title}" vào hàng chờ!`);
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-[380px] bg-zinc-950 border border-white/15 rounded-[2.5rem] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-white flex flex-col gap-5 overflow-hidden cursor-default"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-instrument text-base font-bold tracking-tight text-white">
                  Messages & Friends
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {friends.length} người bạn
                </p>
              </div>
            </div>
          </div>

          {/* Selected Track Preview Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 shrink-0 overflow-hidden relative border border-white/10 flex items-center justify-center">
              {displayCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayCover} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Disc className="w-6 h-6 text-white/30" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                {track.title}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                {track.artist || 'Nghệ sĩ'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToQueue}
              className="p-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/10 transition-all text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
              title="Thêm vào hàng chờ"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Send To Friend Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Chọn bạn bè để gửi nhạc:
            </label>

            {isLoading ? (
              <div className="py-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 bg-white/5 rounded-2xl border border-white/10 p-4">
                Chưa có bạn bè nào trong danh sách. Hãy thêm bạn bằng Mã Bạn Bè để gửi nhạc!
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriendId === friend.id;
                  const initial = friend.name?.charAt(0).toUpperCase() || friend.email?.charAt(0).toUpperCase() || 'U';

                  return (
                    <div
                      key={friend.id}
                      onClick={() => {
                        setSelectedFriendId(friend.id);
                        handleSendToFriend(friend.id);
                      }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none group",
                        isSelected
                          ? "bg-white text-zinc-950 border-white shadow-lg font-semibold"
                          : "bg-zinc-900/60 hover:bg-zinc-800 text-white border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 relative",
                          isSelected ? "bg-zinc-950 text-white border-zinc-800" : "bg-zinc-800 text-white border-white/10"
                        )}>
                          {initial ? initial : <UserIcon size={16} />}
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950",
                              friend.isOnline ? "bg-white" : "bg-zinc-600"
                            )}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                            {friend.name || friend.email}
                          </p>
                          <p className={cn("text-[11px] truncate mt-0.5", isSelected ? "text-zinc-600" : "text-zinc-400")}>
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all",
                        isSelected ? "bg-zinc-950 text-white border-zinc-950" : "bg-white/10 text-white group-hover:bg-white group-hover:text-black border-white/10"
                      )}>
                        <Send size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép liên kết'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
