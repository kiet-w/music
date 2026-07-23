'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { User, Check, X, Loader2 } from 'lucide-react';

interface InvitePopupProps {
  senderName: string;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export const InvitePopup: React.FC<InvitePopupProps> = ({
  senderName,
  onAccept,
  onDecline,
  isLoading = false,
}) => {
  const t = useTranslations('Chat');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-dark w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 mb-6 flex items-center justify-center shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('invite_popup_title')}
          </h2>
          
          <p className="text-white/60 mb-8 px-4">
            {t('invite_popup_description', { name: senderName })}
          </p>
          
          <div className="w-full flex flex-col gap-3">
            <Button 
              onClick={onAccept}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-white/90 text-black font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              {t('accept')}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={onDecline}
              disabled={isLoading}
              className="w-full h-12 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs"
            >
              <X className="w-4 h-4 mr-2" />
              {t('cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
