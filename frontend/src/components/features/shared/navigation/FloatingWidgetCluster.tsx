'use client';

// ponytail: persistent multi-popup widget cluster with non-hiding action buttons (Account bottom-left, Chat bottom-right, Convert top-right)
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, User } from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

const AddMusicPopup = dynamic(
  () => import('@/components/features/music/AddMusicPopup'),
  { ssr: false }
);
const ChatRightBar = dynamic(
  () => import('@/components/features/chat/ChatRightBar'),
  { ssr: false }
);
const UserAccountPopup = dynamic(
  () => import('@/components/features/auth/UserAccountPopup'),
  { ssr: false }
);

export function FloatingWidgetCluster() {
  const [openPopups, setOpenPopups] = useState({
    addMusic: false,
    chat: false,
    userAccount: false,
  });
  const [avatarError, setAvatarError] = useState(false);

  const { user } = useAuthStore();
  const { unreadMessages } = useChatStore();

  // Listen to custom event for opening add music from header
  useEffect(() => {
    const handleOpenAddMusic = () => {
      setOpenPopups((prev) => ({ ...prev, addMusic: true }));
    };
    window.addEventListener('open-add-music-popup', handleOpenAddMusic);
    return () => window.removeEventListener('open-add-music-popup', handleOpenAddMusic);
  }, []);

  const unreadCount = Array.isArray(unreadMessages)
    ? unreadMessages.length
    : Object.keys(unreadMessages || {}).filter((id) => unreadMessages[id]).length;

  const togglePopup = (key: 'addMusic' | 'chat' | 'userAccount') => {
    setOpenPopups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const closePopup = (key: 'addMusic' | 'chat' | 'userAccount') => {
    setOpenPopups((prev) => ({ ...prev, [key]: false }));
  };

  const avatarMediaUrl = getMediaUrl(user?.avatarUrl);

  return (
    <>
      {/* 1. Add Music Popup (Anchored Top-Right, LARGER SIZE) */}
      <AnimatePresence>
        {openPopups.addMusic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed top-16 right-3 sm:right-6 lg:right-8 z-40 w-[calc(100vw-1.5rem)] sm:w-[500px] md:w-[540px] h-[580px] max-h-[calc(100dvh-5rem)] rounded-[2.5rem] bg-zinc-950/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden text-white p-5"
          >
            <AddMusicPopup
              isOpen={true}
              onClose={() => closePopup('addMusic')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Messages / Chat Popup (Anchored Bottom-Right, LARGER SIZE) */}
      <AnimatePresence>
        {openPopups.chat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed bottom-20 right-3 sm:right-6 lg:right-8 z-40 w-[calc(100vw-1.5rem)] sm:w-[460px] md:w-[500px] h-[580px] max-h-[calc(100dvh-6rem)] rounded-[2.5rem] bg-zinc-950/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col overflow-hidden text-white"
          >
            <ChatRightBar onClose={() => closePopup('chat')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. User Account Popup (Anchored Bottom-Left, LARGER SIZE) */}
      <AnimatePresence>
        {openPopups.userAccount && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="fixed bottom-20 left-3 sm:left-6 lg:left-8 z-40 w-[calc(100vw-1.5rem)] sm:w-[440px] md:w-[480px] h-[580px] max-h-[calc(100dvh-6rem)] rounded-[2.5rem] bg-zinc-950/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-5 flex flex-col overflow-y-auto text-white"
          >
            <UserAccountPopup
              isOpen={true}
              onClose={() => closePopup('userAccount')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ALWAYS-VISIBLE INDEPENDENT ACTION BUTTONS --- */}

      {/* Top-Right Floating Button: Convert / Add Music (+) */}
      <div className="fixed top-4 right-3 sm:right-6 z-50 flex items-center gap-2 transition-all duration-300">
        <button
          onClick={() => togglePopup('addMusic')}
          className={cn(
            "h-9 px-3.5 rounded-full flex items-center gap-2 border cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-bold uppercase tracking-wider shadow-2xl",
            openPopups.addMusic
              ? "bg-white text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              : "bg-zinc-950/90 hover:bg-zinc-900 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Convert / Thêm Nhạc"
          aria-label="Convert / Thêm Nhạc"
        >
          <Plus
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              openPopups.addMusic ? "rotate-45" : ""
            )}
            strokeWidth={2.5}
          />
          <span>Convert / Thêm Nhạc</span>
        </button>
      </div>

      {/* Bottom-Left Floating Button: User Account (👤 / Avatar) */}
      <div className="fixed bottom-5 left-3 sm:left-6 z-50 flex items-center gap-3 transition-all duration-300">
        <button
          onClick={() => togglePopup('userAccount')}
          className={cn(
            "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group overflow-hidden shadow-2xl",
            openPopups.userAccount
              ? "bg-white text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              : "bg-zinc-950/90 hover:bg-zinc-900 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Tài khoản"
          aria-label="Tài khoản"
        >
          {avatarMediaUrl && !avatarError && !openPopups.userAccount ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarMediaUrl}
              alt={user?.name || 'User Avatar'}
              onError={() => setAvatarError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5" strokeWidth={2.2} />
          )}
        </button>
      </div>

      {/* Bottom-Right Floating Button: Chat (💬) */}
      <div className="fixed bottom-5 right-3 sm:right-6 z-50 flex items-center gap-3 transition-all duration-300">
        <button
          onClick={() => togglePopup('chat')}
          className={cn(
            "relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group shadow-2xl",
            openPopups.chat
              ? "bg-white text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              : "bg-zinc-950/90 hover:bg-zinc-900 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Mở Chat"
          aria-label="Mở Chat"
        >
          <MessageSquare className="w-5 h-5" strokeWidth={2.2} />
          {unreadCount > 0 && !openPopups.chat && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-white text-zinc-950 text-[10px] font-extrabold ring-2 ring-zinc-950 shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export default FloatingWidgetCluster;
