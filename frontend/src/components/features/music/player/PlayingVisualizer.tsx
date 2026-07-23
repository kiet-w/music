'use client';

import React from 'react';

export default function PlayingVisualizer() {
  return (
    <div className="flex gap-0.5 items-end h-3 flex-shrink-0">
      <span className="w-0.5 h-full bg-white rounded-full animate-music-bar-1 origin-bottom will-change-transform" />
      <span className="w-0.5 h-full bg-white rounded-full animate-music-bar-2 origin-bottom will-change-transform" />
      <span className="w-0.5 h-full bg-white rounded-full animate-music-bar-3 origin-bottom will-change-transform" />
    </div>
  );
}
