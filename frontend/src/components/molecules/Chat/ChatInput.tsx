'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations('Chat');
  const keyboardHeight = useKeyboardHeight();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || disabled || isSending) return;

    setContent('');
    setIsSending(true);
    try {
      await onSend(text);
    } catch (error) {
      setContent(text); // Restore text if send failed
    } finally {
      setIsSending(false);
    }
  };

  const handleFocus = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-white/10 shrink-0 bg-black/90 backdrop-blur-md"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
          placeholder={t('type_placeholder') || 'Nhập tin nhắn...'}
          disabled={disabled || isSending}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
