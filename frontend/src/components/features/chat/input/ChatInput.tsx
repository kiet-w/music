'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
}

// ponytail: floating chat input card with rounded corners and high contrast send button
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const t = useTranslations('Chat');

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

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-2xl shrink-0 backdrop-blur-md relative z-20 w-full shadow-lg"
    >
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('type_placeholder') || 'Nhập tin nhắn...'}
          disabled={disabled || isSending}
          className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-white/30 focus:outline-none transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
