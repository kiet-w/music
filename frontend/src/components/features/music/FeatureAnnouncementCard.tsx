'use client';

import React from 'react';
import { ArrowRight, Music, Sparkles, LucideIcon } from 'lucide-react';

export interface FeatureAnnouncementCardProps {
  icon?: LucideIcon;
  title: string;
  description: React.ReactNode;
  secondaryDescription?: React.ReactNode;
  actionText: string;
  onAction: () => void;
  footerText?: string;
  footerIcon?: LucideIcon;
}

// ponytail: unified announcement card with monochromatic studio aesthetic & rounded-[2.5rem]
export const FeatureAnnouncementCard: React.FC<FeatureAnnouncementCardProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  secondaryDescription,
  actionText,
  onAction,
  footerText,
  footerIcon: FooterIcon = Music,
}) => {
  return (
    <div className="max-w-xl w-full bg-card border border-white/10 shadow-2xl rounded-[2.5rem] p-8 md:p-12 transition-all duration-300 text-center">
      <div className="flex justify-center mb-6">
        <div className="h-16 w-16 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center shadow-lg">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold font-instrument tracking-tighter text-foreground mb-4">
        {title}
      </h1>

      <div className="space-y-3 text-muted-foreground text-base mb-8 max-w-md mx-auto leading-relaxed">
        {typeof description === 'string' ? <p>{description}</p> : description}
        {secondaryDescription && (
          typeof secondaryDescription === 'string' ? (
            <p className="text-xs text-muted-foreground/80">{secondaryDescription}</p>
          ) : (
            secondaryDescription
          )
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onAction}
          className="group px-6 py-3.5 bg-white hover:bg-white/90 text-black font-bold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {footerText && (
        <div className="mt-8 flex justify-center items-center gap-2 text-xs text-muted-foreground font-mono">
          <FooterIcon className="h-4 w-4" />
          <span>{footerText}</span>
        </div>
      )}
    </div>
  );
};

export default FeatureAnnouncementCard;

