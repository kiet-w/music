'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DEFAULT_FACEBOOK_REACTIONS = [
  { emoji: '👍', name: 'Thích' },
  { emoji: '❤️', name: 'Yêu thích' },
  { emoji: '😂', name: 'Cười' },
  { emoji: '😮', name: 'Bất ngờ' },
  { emoji: '😢', name: 'Buồn' },
  { emoji: '😡', name: 'Phẫn nộ' },
];

export const EXTRA_EMOJIS_BY_CATEGORY = [
  {
    category: 'Phổ biến',
    emojis: ['🔥', '🎉', '🚀', '💯', '👏', '🙏', '💩', '🤡', '🥳', '😈', '🌟', '👀', '💖', '🙈', '🤝', '⚡'],
  },
  {
    category: 'Biểu cảm',
    emojis: ['🥰', '😍', '🤩', '😎', '😜', '🤪', '😭', '🤯', '😱', '🥺', '🥶', '🥵', '😴', '🤤', '🤠', '🤐'],
  },
  {
    category: 'Bàn tay & Cơ thể',
    emojis: ['✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👊', '🤜', '🤛', '💪', '🤝', '👏', '🙌'],
  },
  {
    category: 'Đối tượng & Hoạt động',
    emojis: ['⚽', '🏀', '🎮', '🎲', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🏆', '🥇', '🎁', '🎈', '🎉', '🎊'],
  },
  {
    category: 'Đồ ăn & Thức uống',
    emojis: ['☕', '🍺', '🍻', '🍷', '🥂', '🍾', '🍕', '🍔', '🍟', '🍣', '🍦', '🍩', '🍫', '🍿', '🥑', '🍎'],
  },
];

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  currentReaction?: string;
  isMe?: boolean;
}

export function ReactionPicker({
  onSelectEmoji,
  onClose,
  currentReaction,
  isMe = false,
}: ReactionPickerProps) {
  const [showMorePicker, setShowMorePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredCategories = EXTRA_EMOJIS_BY_CATEGORY.map((cat) => ({
    ...cat,
    emojis: cat.emojis.filter((emoji) =>
      searchQuery ? emoji.includes(searchQuery) : true
    ),
  })).filter((cat) => cat.emojis.length > 0);

  return (
    <div
      ref={pickerRef}
      className={cn(
        "absolute z-50 flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none",
        isMe ? "right-0 bottom-[calc(100%+6px)] items-end" : "left-0 bottom-[calc(100%+6px)] items-start"
      )}
    >
      {/* Compact Facebook Reactions Bar (No text labels) */}
      <div className="flex items-center gap-0.5 p-1 px-1.5 rounded-full bg-slate-950/95 border border-white/15 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
        {DEFAULT_FACEBOOK_REACTIONS.map((item) => {
          const isSelected = currentReaction === item.emoji;
          return (
            <button
              key={item.emoji}
              type="button"
              onClick={() => {
                onSelectEmoji(item.emoji);
                onClose();
              }}
              className={cn(
                "flex items-center justify-center w-7 h-7 text-lg transition-all duration-150 rounded-full hover:scale-125 hover:-translate-y-1 active:scale-90 focus:outline-none outline-none border-none bg-transparent",
                isSelected && "scale-110"
              )}
            >
              <span className="transform transition-transform hover:rotate-6">
                {item.emoji}
              </span>
            </button>
          );
        })}

        <div className="w-px h-4 bg-white/15 mx-1" />

        {/* Expand More Emojis Button ("+") */}
        <button
          type="button"
          onClick={() => setShowMorePicker(!showMorePicker)}
          className={cn(
            "flex items-center justify-center w-6.5 h-6.5 rounded-full text-white/70 hover:text-white bg-white/5 hover:bg-white/20 transition-all focus:outline-none",
            showMorePicker && "bg-emerald-500/30 text-emerald-400 ring-1 ring-emerald-500/50"
          )}
        >
          <Plus className={cn("w-3.5 h-3.5 transition-transform duration-200", showMorePicker && "rotate-45")} />
        </button>
      </div>

      {/* Expanded Emoji Picker Modal */}
      {showMorePicker && (
        <div className={cn(
          "mt-1.5 w-64 max-h-72 bg-slate-950/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-white/10",
          isMe ? "right-0" : "left-0"
        )}>
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[11px] font-semibold text-white/80">Kho biểu tượng</span>
            <button
              type="button"
              onClick={() => setShowMorePicker(false)}
              className="p-0.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-white/70 text-xs">
            <Search className="w-3 h-3 text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Tìm emoji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-[11px] w-full placeholder:text-white/30"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-48 pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-white/15">
            {filteredCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="text-[9px] font-semibold tracking-wider text-white/40 uppercase px-1">
                  {cat.category}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(emoji);
                        onClose();
                      }}
                      className={cn(
                        "flex items-center justify-center h-7 text-lg rounded-lg hover:bg-white/15 transition-all active:scale-90 hover:scale-110",
                        currentReaction === emoji && "bg-emerald-500/30 border border-emerald-500/50"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-4 text-xs text-white/40 flex flex-col items-center gap-1">
                <Smile className="w-5 h-5 text-white/20" />
                <span className="text-[11px]">Không tìm thấy</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
