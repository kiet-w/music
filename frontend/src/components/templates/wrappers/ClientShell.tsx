'use client';

import dynamic from 'next/dynamic';

// ponytail: unified client shell with floating widget cluster navigation, mobile bottom tabs, and audio player bar
const PlayerBar = dynamic(() => import('@/components/features/music/player/PlayerBar'), {
  ssr: false,
});
const BottomTabBar = dynamic(
  () => import('@/components/features/shared/navigation/BottomTabBar'),
  { ssr: false }
);
const FloatingWidgetCluster = dynamic(
  () => import('@/components/features/shared/navigation/FloatingWidgetCluster'),
  { ssr: false }
);

export function ClientShell() {
  return (
    <>
      <PlayerBar />
      <FloatingWidgetCluster />
      <BottomTabBar />
    </>
  );
}
