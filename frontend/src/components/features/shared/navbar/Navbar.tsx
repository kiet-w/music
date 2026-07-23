'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Disc, LogOut, MessageCircle, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

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
      badge: unreadMessages.length > 0
    },
    { href: '/user', icon: User, label: t('user') || 'Tài khoản' },
  ];

  // Helper to handle locale prefix in pathname
  const isActive = (href: string) => {
    return pathname.includes(href);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[358px] h-[60px] glass-dark shadow-soft rounded-[1.25rem] flex items-center justify-around px-6 z-40 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link 
            key={item.href} 
            href={`/${locale}${item.href === '/' ? '' : item.href}`}
            prefetch={true}
            className={cn(
              "relative flex flex-col items-center gap-1 transition-all duration-300",
              active ? "text-white scale-110" : "text-white/40 hover:text-white/70"
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.5} />
              {(item as any).badge && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#070b14] shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </div>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300",
              active ? "opacity-100" : "opacity-0"
            )}>
              {item.label}
            </span>
            {active && (
              <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-glow" />
            )}
          </Link>
        );
      })}

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="relative flex flex-col items-center gap-1 transition-all duration-300 text-white/40 hover:text-white/70"
        title={user?.email || 'Logout'}
      >
        <LogOut size={22} strokeWidth={1.5} />
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity duration-300">
          Logout
        </span>
      </button>
    </nav>
  );
}
