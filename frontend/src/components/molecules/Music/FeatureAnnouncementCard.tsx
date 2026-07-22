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
    <div className="max-w-2xl w-full bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl p-8 md:p-12 transition-all duration-300 hover:shadow-cyan-500/10 text-center">
      <div className="flex justify-center mb-8">
        <div className="h-20 w-20 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
          <Icon className="h-10 w-10 text-white animate-pulse" />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-6">
        {title}
      </h1>

      <div className="space-y-4 text-gray-600 dark:text-gray-300 text-lg mb-8 max-w-lg mx-auto">
        {typeof description === 'string' ? <p>{description}</p> : description}
        {secondaryDescription && (
          typeof secondaryDescription === 'string' ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{secondaryDescription}</p>
          ) : (
            secondaryDescription
          )
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onAction}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 overflow-hidden"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {footerText && (
        <div className="mt-8 flex justify-center items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <FooterIcon className="h-4 w-4" />
          <span>{footerText}</span>
        </div>
      )}
    </div>
  );
};

export default FeatureAnnouncementCard;
