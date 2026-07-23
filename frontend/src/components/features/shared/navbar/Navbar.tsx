'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Disc, LogOut, MessageCircle, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

// ponytail: 2-color monochromatic top navigation header (Strict Black & White System)
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Navbar');
  const { clearSession, user } = useAuthStore();
  const { unreadMessages } = useChatStore();

  const handleLogout = () => {
    clearSession();
    router.push(`/${locale}/login`);
  };

  const navItems = [
    { href: '/albums', icon: Disc, label: t('albums') || 'Album' },
    { href: '/music', icon: Music, label: t('music') || 'Nhạc' },
    {
      href: '/messages',
      icon: MessageCircle,
      label: t('messages') || 'Chat',
      badge: unreadMessages.length > 0 ? unreadMessages.length : null,
    },
    { href: '/user', icon: User, label: t('user') || 'Tài khoản' },
  ];

  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl h-16 bg-black/90 backdrop-blur-2xl rounded-2xl shadow-2xl hidden md:flex items-center justify-between px-6 z-40 border border-white/10 transition-all duration-300">
      {/* Brand / Logo (2-Color Monochromatic Black & White) */}
      <Link href={`/${locale}/albums`} className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
          <Music size={19} strokeWidth={2.5} />
        </div>
        <span className="font-instrument font-extrabold text-lg tracking-tight text-white">
          BEATVIBE
        </span>
      </Link>

      {/* Center Nav Links (Strict 2-Color System) */}
      <nav className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href === '/' ? '' : item.href}`}
              prefetch={true}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-95",
                active
                  ? "bg-white text-black shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <div className="relative flex items-center">
                <Icon size={16} strokeWidth={2} />
                {item.badge && (
                  <span className={cn(
                    "absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full text-[10px] font-extrabold shadow-sm",
                    active ? "bg-black text-white" : "bg-white text-black"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Actions / Logout */}
      <div className="flex items-center gap-4">
        {user?.email && (
          <span className="text-xs text-white/50 font-medium truncate max-w-[160px] hidden lg:inline-block">
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-95 cursor-pointer"
          title={user?.email || t('logout') || 'Logout'}
        >
          <LogOut size={15} strokeWidth={2} />
          <span>{t('logout') || 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
