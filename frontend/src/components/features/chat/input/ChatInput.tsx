'use client';

import React, { useState } from 'react';
import { Send, Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePlayerStore } from '@/store/usePlayerStore';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations('Chat');
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || disabled || isSending) return;

    setContent('');
    setIsSending(true);
    try {
      await onSend(text);
    } catch (error) {
      setContent(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleShareCurrentSong = async () => {
    if (!currentTrack) {
      toast.error('Hãy chọn hoặc phát 1 bài hát trước khi chia sẻ vào chat!');
      return;
    }
    if (disabled || isSending) return;

    setIsSending(true);
    try {
      const payload = JSON.stringify({
        type: 'song_share',
        title: currentTrack.title,
        artist: currentTrack.artist || 'Nghệ sĩ',
        url: currentTrack.url,
        coverUrl: currentTrack.coverUrl || '',
      });
      await onSend(payload);
      toast.success(`Đã chia sẻ bài hát "${currentTrack.title}" vào đoạn chat!`);
    } catch (error) {
      toast.error('Không thể chia sẻ bài hát lúc này');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-2xl shrink-0 backdrop-blur-md relative z-20 w-full shadow-lg"
    >
      <div className="flex gap-2 items-center">
        {/* Share Currently Playing Song Button */}
        <button
          type="button"
          onClick={handleShareCurrentSong}
          disabled={disabled || isSending}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 disabled:opacity-40 shrink-0 cursor-pointer border border-white/10"
          title={currentTrack ? `Chia sẻ bài hát "${currentTrack.title}" vào chat` : "Chia sẻ bài hát đang phát"}
        >
          <Music size={16} />
        </button>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('type_placeholder') || 'Nhập tin nhắn...'}
          disabled={disabled || isSending}
          className="flex-1 bg-transparent px-2 sm:px-3 py-2 text-white placeholder:text-white/30 focus:outline-none transition-colors text-sm"
        />

        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
