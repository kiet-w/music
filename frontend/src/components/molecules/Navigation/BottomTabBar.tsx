'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Disc, Music, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';

export const BottomTabBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Music'); // Using Music namespace for now
  const { clearSession, user } = useAuthStore();

  const handleLogout = () => {
    clearSession();
    router.push(`/${locale}/login`);
  };

  // Function to check if a tab is active based on pathname
  const isActive = (path: string) => {
    // Basic check for exact match or starts with (for /albums/id)
    if (path === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/';
    }
    return pathname.includes(path);
  };

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Albums', path: '/albums', icon: Disc },
    { name: 'Music', path: '/music', icon: Music },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
      <div className="mx-auto max-w-[390px] flex items-center justify-around bg-card border-[0.5px] border-border rounded-full h-[64px] px-2 shadow-soft pointer-events-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <Link 
              key={tab.name}
              href={`/${locale}${tab.path === '/' ? '' : tab.path}`}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <Icon 
                size={22} 
                strokeWidth={active ? 2.5 : 2} 
                className={cn("transition-transform duration-200", active && "-translate-y-1")}
              />
              <span className={cn(
                "text-[10px] font-medium absolute bottom-2 opacity-0 transition-opacity duration-200",
                active && "opacity-100"
              )}>
                {tab.name}
              </span>
              {/* Dot indicator */}
              {active && (
                <span className="absolute bottom-[6px] w-1 h-1 bg-foreground rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-colors duration-200 text-muted-foreground hover:text-foreground/80"
          title={user?.email || 'Logout'}
        >
          <LogOut size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium absolute bottom-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};
