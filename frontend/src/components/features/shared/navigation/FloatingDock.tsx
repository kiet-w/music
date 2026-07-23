'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Plus, MessageCircle, User, X, Youtube, HardDrive, LogOut, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { getMediaUrl } from '@/lib/utils';

const ChatRightBar = dynamic(() => import('@/components/features/chat/ChatRightBar'), {
  ssr: false,
});
const AddMusicPopup = dynamic(() => import('@/components/features/music/AddMusicPopup'), {
  ssr: false,
});
const UserAccountPopup = dynamic(() => import('@/components/features/auth/UserAccountPopup'), {
  ssr: false,
});

type ActivePopup = 'addMusic' | 'chat' | 'userAccount' | null;

// ponytail: floating dock with 3 tactile action buttons for quick music add, chat & user profile popups
export default function FloatingDock() {
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);
  const [addMusicTab, setAddMusicTab] = useState<'youtube' | 'drive'>('youtube');
  const [avatarError, setAvatarError] = useState(false);

  const { user, clearSession } = useAuthStore();
  const { unreadMessages } = useChatStore();
  const isKeyboardVisible = useKeyboardVisible();
  const locale = useLocale();
  const router = useRouter();

  const unreadCount = Array.isArray(unreadMessages)
    ? unreadMessages.length
    : Object.keys(unreadMessages).filter((id) => unreadMessages[id]).length;

  const togglePopup = (popup: ActivePopup) => {
    setActivePopup((prev) => (prev === popup ? null : popup));
  };

  const handleLogout = async () => {
    setActivePopup(null);
    await clearSession();
    router.push(`/${locale}/login`);
  };

  const userInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const avatarMediaUrl = getMediaUrl(user?.avatarUrl);

  return (
    <>
      {/* Popups Overlay / Floating Windows */}

      {/* 1. Add Music Popup */}
      <AddMusicPopup
        isOpen={activePopup === 'addMusic'}
        onClose={() => setActivePopup(null)}
        defaultTab={addMusicTab}
      />

      {/* 2. Chat Popup */}
      {activePopup === 'chat' && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] max-h-[calc(100dvh-7.5rem)] rounded-[2.5rem] border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ChatRightBar />
        </div>
      )}

      {/* 3. User Account Popup */}
      <UserAccountPopup
        isOpen={activePopup === 'userAccount'}
        onClose={() => setActivePopup(null)}
        locale={locale}
      />

      {/* Floating Action Buttons Dock at Bottom Right */}
      <div
        className={cn(
          "fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 transition-all duration-300",
          isKeyboardVisible && "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Button 1: Add Music (opens AddMusicPopup) */}
        <button
          onClick={() => togglePopup('addMusic')}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl border cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group",
            activePopup === 'addMusic'
              ? "bg-white border-white/20 text-black shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              : "bg-zinc-900/90 hover:bg-zinc-800 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Thêm Nhạc"
        >
          <Plus
            size={24}
            strokeWidth={2.5}
            className={cn(
              "transition-transform duration-300",
              activePopup === 'addMusic' ? "rotate-45" : "group-hover:rotate-90"
            )}
          />
        </button>

        {/* Button 2: Chat (opens ChatPopup) */}
        <button
          onClick={() => togglePopup('chat')}
          className={cn(
            "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl border cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group",
            activePopup === 'chat'
              ? "bg-white border-white/20 text-black shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              : "bg-zinc-900/90 hover:bg-zinc-800 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Mở Chat"
        >
          <MessageCircle size={22} strokeWidth={2.2} />
          {unreadCount > 0 && activePopup !== 'chat' && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center px-1 rounded-full bg-white text-[11px] font-extrabold text-black ring-2 ring-zinc-950 shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Button 3: User Account (opens UserAccountPopup) */}
        <button
          onClick={() => togglePopup('userAccount')}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl border cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group overflow-hidden",
            activePopup === 'userAccount'
              ? "bg-white border-white/20 text-black shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              : "bg-zinc-900/90 hover:bg-zinc-800 border-white/20 text-white backdrop-blur-xl shadow-black/80"
          )}
          title="Tài khoản"
        >
          <User size={22} strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}
