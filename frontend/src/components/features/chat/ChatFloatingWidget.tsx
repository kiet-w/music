'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useChatStore } from '@/store/useChatStore';
import { cn } from '@/lib/utils';

const ChatRightBar = dynamic(() => import('@/components/features/chat/ChatRightBar'), {
  ssr: false,
});

// ponytail: floating bottom-right chat button & pop-up drawer widget
export function ChatFloatingWidget() {
  const t = useTranslations('Chat');
  const [isOpen, setIsOpen] = useState(false);
  const { unreadMessages } = useChatStore();

  const unreadCount = Array.isArray(unreadMessages)
    ? unreadMessages.length
    : Object.keys(unreadMessages).filter((id) => unreadMessages[id]).length;

  return (
    <>
      {/* Floating Pop-up Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] max-h-[calc(100dvh-7.5rem)] rounded-[2.5rem] border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ChatRightBar />
        </div>
      )}

      {/* Floating Action Button (FAB) at Bottom Right */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border cursor-pointer active:scale-95 group",
          isOpen
            ? "bg-zinc-900 border-white/20 text-white hover:bg-zinc-800"
            : "bg-emerald-500 border-emerald-400/50 text-black hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
        )}
        title={isOpen ? t('close_chat') : t('open_chat')}
      >
        {isOpen ? (
          <X size={24} strokeWidth={2.2} />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageCircle size={26} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center px-1 rounded-full bg-rose-500 text-[11px] font-extrabold text-white ring-2 ring-zinc-950 shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>
    </>
  );
}
