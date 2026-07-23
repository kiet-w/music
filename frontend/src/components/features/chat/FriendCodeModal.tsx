'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  Check, 
  UserPlus, 
  KeyRound, 
  X, 
  Clipboard, 
  Share2, 
  User, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { createInvite, acceptInvite, getInviteInfo } from '@/lib/api';
import { toast } from 'sonner';
import { LoadingPopup } from '@/components/ui/loading-popup';

interface FriendCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onSuccessConnect: (senderId: string) => void;
}

export const FriendCodeModal: React.FC<FriendCodeModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onSuccessConnect,
}) => {
  const t = useTranslations('Chat');
  const [activeTab, setActiveTab] = useState<'create' | 'enter'>('create');
  
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const [inputToken, setInputToken] = useState('');
  const [previewInfo, setPreviewInfo] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGeneratedToken(null);
      setInputToken('');
      setPreviewInfo(null);
      setPreviewError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let cleanToken = inputToken.trim();
    if (cleanToken.includes('token=')) {
      cleanToken = cleanToken.split('token=')[1].split('&')[0];
    } else if (cleanToken.includes('/invite/')) {
      const parts = cleanToken.split('/invite/');
      cleanToken = parts[1].split('?')[0].split('/')[0];
    }

    if (!cleanToken || cleanToken.length < 8) {
      setPreviewInfo(null);
      setPreviewError(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsPreviewLoading(true);
      setPreviewError(null);
      getInviteInfo(cleanToken)
        .then((data) => {
          setPreviewInfo(data);
          setPreviewError(null);
        })
        .catch((err) => {
          console.error('Invite lookup error:', err);
          setPreviewInfo(null);
          setPreviewError(t('invalid_or_expired_code'));
        })
        .finally(() => {
          setIsPreviewLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [inputToken, t]);

  if (!isOpen) return null;

  const getShortDisplayCode = (tokenStr: string) => {
    const raw = tokenStr.replace(/-/g, '').toUpperCase();
    if (raw.length >= 8) {
      return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    }
    return tokenStr.toUpperCase();
  };

  const handleGenerateToken = async () => {
    setIsCreating(true);
    try {
      const { token } = await createInvite(accessToken);
      setGeneratedToken(token);
      toast.success(t('code_created_success'));
    } catch (err: any) {
      console.error('Failed to create invite token:', err);
      toast.error(err?.message || t('create_friend_code_error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyTokenOnly = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    toast.success(t('code_copied_success'));
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleShareToken = async () => {
    if (!generatedToken) return;
    const shortCode = getShortDisplayCode(generatedToken);
    const textToShare = t('connect_with_user', { name: shortCode });

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('friend_code'),
          text: textToShare,
        });
      } catch (err) {
        handleCopyTokenOnly();
      }
    } else {
      handleCopyTokenOnly();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputToken(text.trim());
        toast.success(t('pasted_code_success'));
      }
    } catch (err) {
      toast.error(t('grant_paste_permission'));
    }
  };

  const handleAcceptByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    let tokenStr = inputToken.trim();
    if (!tokenStr) {
      toast.error(t('enter_friend_code'));
      return;
    }

    if (tokenStr.includes('token=')) {
      tokenStr = tokenStr.split('token=')[1].split('&')[0];
    } else if (tokenStr.includes('/invite/')) {
      const parts = tokenStr.split('/invite/');
      tokenStr = parts[1].split('?')[0].split('/')[0];
    }

    setIsSubmitting(true);
    try {
      const res = await acceptInvite(accessToken, tokenStr);
      toast.success(t('accept_invite_success'));
      onClose();
      if (res?.senderId) {
        onSuccessConnect(res.senderId);
      }
    } catch (err: any) {
      console.error('Failed to accept by token:', err);
      toast.error(err?.message || t('accept_friend_code_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-[#09090B] w-full max-w-[340px] sm:max-w-sm rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col gap-4 relative shadow-2xl animate-in zoom-in-95 duration-200">
          
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-10 h-10 rounded-full bg-[#1b211d] flex items-center justify-center mb-1 border border-white/10">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg text-white">{t('friend_code')}</h1>
            <p className="font-normal text-xs text-[#71717A]">{t('friend_code_modal_sub')}</p>
          </div>

          <div className="bg-[#18181B] rounded-full p-1 flex border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 font-medium py-1.5 px-3 rounded-full transition-all ${
                activeTab === 'create'
                  ? 'bg-[#27272A] text-white shadow-sm'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              {t('tab_get_code')}
            </button>
            <button
              onClick={() => setActiveTab('enter')}
              className={`flex-1 font-medium py-1.5 px-3 rounded-full transition-all ${
                activeTab === 'enter'
                  ? 'bg-[#27272A] text-white shadow-sm'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              {t('tab_enter_code')}
            </button>
          </div>

          {activeTab === 'create' && (
            <div className="flex flex-col gap-3">
              {generatedToken ? (
                <div className="flex flex-col items-center gap-3 py-1 animate-in fade-in zoom-in-95">
                  <div className="w-full bg-[#1b211d] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 relative overflow-hidden">
                    <div className="text-2xl font-mono font-bold text-white tracking-[0.2em] select-all z-10">
                      {getShortDisplayCode(generatedToken)}
                    </div>
                  </div>
                  
                  <div className="flex w-full gap-2 mt-1">
                    <button
                      onClick={handleCopyTokenOnly}
                      className="flex-1 bg-[#27272A] text-white hover:bg-[#3f3f46] border border-white/10 font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken ? t('copied') : t('copy')}
                    </button>
                    <button
                      onClick={handleShareToken}
                      className="flex-1 bg-[#27272A] text-white hover:bg-[#3f3f46] border border-white/10 font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('share')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="text-center py-1 mb-3">
                    <p className="font-normal text-xs text-[#71717A]">
                      {t('create_code_desc')}
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateToken}
                    className="w-full bg-[#059669] text-white font-medium text-xs py-3 rounded-xl transition-transform hover:bg-[#047857] active:scale-[0.98]"
                  >
                    {t('create_code_btn')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'enter' && (
            <form onSubmit={handleAcceptByToken} className="flex flex-col gap-3 animate-in fade-in slide-in-from-left-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-[#71717A]">{t('enter_or_paste_code')}</label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[11px] text-[#059669] hover:text-white transition-colors flex items-center gap-1 font-medium"
                  >
                    <Clipboard className="w-3 h-3" /> {t('paste_fast')}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder={t('code_placeholder')}
                    className="bg-[#1b211d] border-white/10 text-white font-mono text-sm h-10 rounded-lg focus:border-[#059669] focus:ring-1 focus:ring-[#059669] uppercase tracking-widest px-3"
                  />
                </div>
              </div>

              {previewInfo && (
                <div className="p-3 rounded-lg bg-[#1b211d] border border-white/10 flex items-center gap-2.5 animate-in fade-in zoom-in-95">
                  <div className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center text-white shrink-0 border border-white/5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-[#059669] font-semibold flex items-center gap-1 uppercase tracking-wider mb-0.5">
                      <CheckCircle2 className="w-3 h-3" /> {t('inviter')}
                    </div>
                    <div className="text-xs font-medium text-white truncate">
                      {previewInfo.sender?.name || previewInfo.sender?.email}
                    </div>
                  </div>
                </div>
              )}

              {previewError && (
                <div className="p-2.5 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!inputToken.trim()}
                className="w-full bg-[#059669] disabled:opacity-50 disabled:active:scale-100 text-white font-medium text-xs py-3 rounded-xl transition-all hover:bg-[#047857] active:scale-[0.98] flex items-center justify-center gap-1.5 mt-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {previewInfo ? t('connect_with_user', { name: previewInfo.sender?.name?.split(' ')[0] || t('user') }) : t('confirm')}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Synchronizing loading states globally using the LoadingPopup */}
      <LoadingPopup isOpen={isCreating} text={t('loading_creating_code')} />
      <LoadingPopup isOpen={isSubmitting} text={t('loading_confirming_friend')} />
      <LoadingPopup isOpen={isPreviewLoading} text={t('loading_searching_code')} />
    </>
  );
};
