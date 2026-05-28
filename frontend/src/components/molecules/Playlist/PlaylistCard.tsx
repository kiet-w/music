"use client";

import React from "react";
import { Music, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaylistCardProps {
  title: string;
  songCount: number;
  imageUrl?: string;
  className?: string;
}

export const PlaylistCard = ({
  title,
  songCount,
  imageUrl,
  className,
}: PlaylistCardProps) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-2xl transition-all duration-300",
        "glass-dark hover:bg-white/10",
        "cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* Liquid Glass Background Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Image / Icon Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Music className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-lg text-white truncate">{title}</h3>
        <p className="text-sm text-white/40">{songCount} songs</p>
      </div>
    </div>
  );
};
