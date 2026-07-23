'use client';

import React from 'react';

interface HomeMoodDiscoverySectionProps {
  moodChips: string[];
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
}

export function HomeMoodDiscoverySection({
  moodChips,
  selectedGenre,
  setSelectedGenre
}: HomeMoodDiscoverySectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-instrument text-2xl font-normal text-white">Khám Phá Theo Tâm Trạng</h2>
        <span className="text-xs text-zinc-400">Lọc nhanh theo thể loại</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {moodChips.map((chip) => (
          <button
            key={chip}
            onClick={() => setSelectedGenre(chip)}
            className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all border cursor-pointer ${
              selectedGenre === chip
                ? 'bg-white text-black border-white font-bold shadow-md'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}
