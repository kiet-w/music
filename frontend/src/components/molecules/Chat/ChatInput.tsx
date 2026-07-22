'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const t = useTranslations('Chat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 shrink-0 bg-black/20">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('type_placeholder') || 'Nhập tin nhắn...'}
          disabled={disabled}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
