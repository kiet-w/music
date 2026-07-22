'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { 
  Copy, 
  Check, 
  UserPlus, 
  KeyRound, 
  X, 
  Sparkles, 
  Clipboard, 
  Share2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { createInvite, acceptInvite, getInviteInfo } from '@/lib/api';
import { toast } from 'sonner';

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
  
  // Tab 1 state: Generated Token
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Tab 2 state: Input Token & Live Sender Preview
  const [inputToken, setInputToken] = useState('');
  const [previewInfo, setPreviewInfo] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening modal
  useEffect(() => {
    if (!isOpen) {
      setGeneratedToken(null);
      setInputToken('');
      setPreviewInfo(null);
      setPreviewError(null);
    }
  }, [isOpen]);

  // Live lookup sender preview as user types/pastes token
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
          setPreviewError('Mã kết bạn không tồn tại hoặc đã hết hạn');
        })
        .finally(() => {
          setIsPreviewLoading(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [inputToken]);

  if (!isOpen) return null;

  // Format short code for display: e.g. "5468-C0C9"
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
      toast.success('Đã tạo Mã Kết Bạn thành công!');
    } catch (err: any) {
      console.error('Failed to create invite token:', err);
      toast.error(err?.message || 'Không thể tạo mã kết bạn');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyTokenOnly = async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    toast.success('Đã sao chép Mã Kết Bạn!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleShareToken = async () => {
    if (!generatedToken) return;
    const shortCode = getShortDisplayCode(generatedToken);
    const textToShare = `Nhập mã kết bạn [ ${shortCode} ] hoặc Token: ${generatedToken} để nhắn tin với mình nhé!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mã kết bạn Music',
          text: textToShare,
        });
      } catch (err) {
        // Fallback to copy if user cancels or share fails
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
        toast.success('Đã dán mã từ khay nhớ tạm!');
      }
    } catch (err) {
      toast.error('Vui lòng cấp quyền dán hoặc dán thủ công');
    }
  };

  const handleAcceptByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    let tokenStr = inputToken.trim();
    if (!tokenStr) {
      toast.error('Vui lòng nhập Mã kết bạn');
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
      toast.success('Đã kết bạn thành công!');
      onClose();
      if (res?.senderId) {
        onSuccessConnect(res.senderId);
      }
    } catch (err: any) {
      console.error('Failed to accept by token:', err);
      toast.error(err?.message || 'Không thể chấp nhận mã kết bạn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-dark w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="p-6 pb-0 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Mã Kết Bạn</h2>
              <p className="text-xs text-white/50">Chia sẻ mã ngắn gọn để kết bạn nhanh chóng</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'create'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Lấy mã của tôi
            </button>
            <button
              onClick={() => setActiveTab('enter')}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'enter'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Nhập mã kết bạn
            </button>
          </div>
        </div>

        {/* Tab 1: Create / Get Token */}
        {activeTab === 'create' && (
          <div className="p-6 flex flex-col gap-5">
            {generatedToken ? (
              <div className="flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 flex flex-col items-center text-center gap-2 relative overflow-hidden">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mã Kết Bạn Ngắn Gọn
                  </span>
                  
                  {/* Short Display Code */}
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-white py-2 shadow-text">
                    {getShortDisplayCode(generatedToken)}
                  </div>

                  <p className="text-[11px] text-white/40 font-mono break-all max-w-xs">
                    Full Token: {generatedToken}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCopyTokenOnly}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl h-12 transition-all flex items-center justify-center gap-2"
                  >
                    {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedToken ? 'Đã sao chép!' : 'Sao chép mã'}
                  </Button>

                  <Button
                    onClick={handleShareToken}
                    variant="outline"
                    className="border-white/15 hover:bg-white/10 text-white font-bold rounded-xl h-12 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ mã
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <p className="text-xs text-white/60 leading-relaxed max-w-xs">
                  Bấm nút bên dưới để tạo **Mã Kết Bạn**. Bạn bè chỉ cần nhập mã này để kết bạn ngay lập tức mà không cần gõ link phức tạp!
                </p>

                <Button
                  onClick={handleGenerateToken}
                  disabled={isCreating}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo mã...
                    </span>
                  ) : (
                    'Tạo Mã Kết Bạn Nhanh'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Enter Token with Live Preview */}
        {activeTab === 'enter' && (
          <form onSubmit={handleAcceptByToken} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70">Nhập hoặc dán Mã Kết Bạn:</label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Dán nhanh
                </button>
              </div>

              <div className="relative">
                <Input
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Ví dụ: 5468-C0C9 hoặc dán Token..."
                  className="bg-black/50 border-white/15 text-white font-mono text-sm sm:text-base h-13 rounded-xl focus:border-emerald-500 placeholder:text-white/20 uppercase tracking-wide pr-10"
                />
                {isPreviewLoading && (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin absolute right-3 top-4" />
                )}
              </div>
            </div>

            {/* Sender Live Preview Card */}
            {previewInfo && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shrink-0 font-bold shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tìm thấy người mời:
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {previewInfo.sender?.name || previewInfo.sender?.email}
                  </div>
                  <div className="text-xs text-white/40 truncate">{previewInfo.sender?.email}</div>
                </div>
              </div>
            )}

            {previewError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !inputToken.trim()}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang kết bạn...
                </span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {previewInfo ? `Kết bạn với ${previewInfo.sender?.name || 'người dùng'}` : 'Xác nhận & Kết bạn'}
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
