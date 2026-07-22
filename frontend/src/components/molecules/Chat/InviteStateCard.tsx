'use client';

import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';

export interface InviteStateCardProps {
  type: 'loading' | 'error';
  title?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const InviteStateCard: React.FC<InviteStateCardProps> = ({
  type,
  title,
  message,
  buttonText,
  onButtonClick,
}) => {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 text-white/60">
        <Loader2 className="w-10 h-10 animate-spin" />
        {message && <p>{message}</p>}
      </div>
    );
  }

  return (
    <div className="glass-dark p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center max-w-md">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      {title && <h2 className="text-xl font-bold text-white mb-2">{title}</h2>}
      {buttonText && onButtonClick && (
        <Button
          onClick={onButtonClick}
          className="mt-6 bg-white/10 hover:bg-white/20 text-white"
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default InviteStateCard;
