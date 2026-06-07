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
    <form onSubmit={handleSubmit} className="p-4 pb-6 border-t border-white/10">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('type_placeholder')}
          disabled={disabled}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-2xl glass-light text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors shadow-soft"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
