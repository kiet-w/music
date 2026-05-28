"use client";

import React from "react";
import { PlaylistCard } from "./PlaylistCard";
import { cn } from "@/lib/utils";

const DEMO_PLAYLISTS = [
  { id: "1", title: "Midnight Melodies", songCount: 42 },
  { id: "2", title: "Morning Vibes", songCount: 15 },
  { id: "3", title: "Focus Flow", songCount: 89 },
  { id: "4", title: "Evening Relaxation", songCount: 24 },
  { id: "5", title: "Road Trip", songCount: 120 },
  { id: "6", title: "Classical Study", songCount: 30 },
];

export const PlaylistGrid = () => {
  const { bentoPlaylists, stats } = React.useMemo(() => {
    const categorized = DEMO_PLAYLISTS.reduce(
      (acc, p) => {
        if (p.songCount > 50) acc.large++;
        else acc.small++;
        return acc;
      },
      { large: 0, small: 0 }
    );

    return { bentoPlaylists: DEMO_PLAYLISTS, stats: categorized };
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {bentoPlaylists.length} Playlists • {stats.large} Large, {stats.small} Small
      </div>
      <div className="grid grid-cols-2 gap-4">
        {bentoPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            title={playlist.title}
            songCount={playlist.songCount}
          />
        ))}
      </div>
    </div>
  );
};
