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

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { clearSession, user } = useAuthStore();
  const { unreadMessages, activeReceiverId } = useChatStore();


  const handleLogout = () => {
    clearSession();
    router.push(`/${locale}/login`);
  };

  // Function to check if a tab is active based on pathname
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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
      <div className="mx-auto max-w-md w-[calc(100%-2.5rem)] flex items-center justify-around glass-dark border-white/10 rounded-full h-[64px] px-2 shadow-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] pointer-events-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <Link 
              key={tab.name}
              href={`/${locale}${tab.path === '/' ? '' : tab.path}`}
              prefetch={true}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-all duration-200 active:scale-[0.98]",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <div className="relative transition-transform duration-300">
                <Icon 
                  size={22} 
                  strokeWidth={1.5} 
                  className={cn(active && "-translate-y-1 scale-110")}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest absolute bottom-2 opacity-0 transition-opacity duration-200",
                active && "opacity-100"
              )}>
                {tab.name}
              </span>
              {/* Dot indicator */}
              {active && (
                <span className="absolute bottom-[6px] w-1 h-1 bg-white rounded-full shadow-glow" />
              )}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-colors duration-200 text-white/40 hover:text-white/70"
          title={user?.email || t('Navbar.logout')}
        >
          <LogOut size={22} strokeWidth={1.5} />
          <span className="text-[10px] font-bold uppercase tracking-widest absolute bottom-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
            {t('Navbar.logout')}
          </span>
        </button>
      </div>
    </div>
  );
};
