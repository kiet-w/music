'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PresenceStatusBadgeProps {
  isOnline?: boolean;
  text: string;
  className?: string;
  dotClassName?: string;
  textClassName?: string;
}

export function PresenceStatusBadge({
  isOnline,
  text,
  className,
  dotClassName,
  textClassName,
}: PresenceStatusBadgeProps) {
  return (
    <div className={cn("flex items-center gap-1.5 min-w-0", className)}>
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isOnline ? "bg-emerald-400 animate-pulse" : "bg-white/30",
          dotClassName
        )}
      />
      <span
        className={cn(
          "font-medium",
          isOnline ? "text-emerald-400" : "text-white/50",
          textClassName
        )}
      >
        {text}
      </span>
    </div>
  );
}

export default PresenceStatusBadge;
