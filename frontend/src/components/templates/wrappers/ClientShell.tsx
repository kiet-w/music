'use client';

import dynamic from 'next/dynamic';

const PlayerBar = dynamic(() => import('@/components/molecules/PlayerBar'), {
  ssr: false,
});
const BottomTabBar = dynamic(
  () => import('@/components/molecules/Navigation/BottomTabBar'),
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
