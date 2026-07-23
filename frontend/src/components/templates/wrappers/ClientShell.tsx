'use client';

import dynamic from 'next/dynamic';

const PlayerBar = dynamic(() => import('@/components/features/music/player/PlayerBar'), {
  ssr: false,
});
const BottomTabBar = dynamic(
  () => import('@/components/features/shared/navigation/BottomTabBar'),
  { ssr: false },
);

export function ClientShell() {
  return (
    <>
      <PlayerBar />
      <BottomTabBar />
    </>
  );
}
