'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Disc, Music, LogOut, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

// ponytail: 2-color monochromatic mobile bottom tab bar (Strict Black & White System)
export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { clearSession, user } = useAuthStore();
  const { unreadMessages } = useChatStore();
  const isKeyboardVisible = useKeyboardVisible();

  const handleLogout = () => {
    clearSession();
    router.push(`/${locale}/login`);
  };

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  const tabs = [
    { name: t('Navbar.albums') || 'Album', path: '/albums', icon: Disc },
    { name: t('Navbar.music') || 'Nhạc', path: '/music', icon: Music },
    { name: t('Navbar.messages') || 'Chat', path: '/messages', icon: MessageCircle, badge: unreadMessages.length },
    { name: t('Navbar.user') || 'Tài khoản', path: '/user', icon: User },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none transition-all duration-300",
        isKeyboardVisible && "translate-y-full opacity-0"
      )}
    >
      <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <Link 
              key={tab.name}
              href={`/${locale}${tab.path === '/' ? '' : tab.path}`}
              prefetch={true}
              className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-95 cursor-pointer",
                active 
                  ? "text-white font-bold scale-110" 
                  : "text-white/50 hover:text-white"
              )}
              title={tab.name}
            >
              <Icon 
                size={22} 
                strokeWidth={active ? 2.2 : 1.5} 
              />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-white text-black text-[10px] font-extrabold shadow-md">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 text-white/50 hover:text-white active:scale-95 cursor-pointer"
          title={user?.email || (t('Navbar.logout') as string) || 'Logout'}
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
