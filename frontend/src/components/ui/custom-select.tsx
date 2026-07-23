'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Disc, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onOpen?: () => void;
  className?: string;
  triggerClassName?: string;
}

export function CustomSelect({
  value = '',
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  onOpen,
  className,
  triggerClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > 220;

      setCoords({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    if (nextState) {
      updateCoords();
      if (onOpen) onOpen();
    }
    setIsOpen(nextState);
  };

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Select Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'w-full h-11 px-3.5 rounded-xl bg-background/50 border border-white/10 hover:border-white/20',
          'flex items-center justify-between text-left text-sm font-medium transition-all duration-200 outline-none',
          'focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-emerald-500/50 ring-2 ring-emerald-500/20 bg-background/80',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          {selectedOption ? (
            <>
              {selectedOption.icon || (
                selectedOption.value === '' ? (
                  <Disc className="w-4 h-4 text-white/50 shrink-0" />
                ) : (
                  <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                )
              )}
              <span className="truncate text-white/90 font-medium">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-white/40">{placeholder}</span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40 shrink-0 ml-1"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Popover Dropdown Menu via Portal to prevent container clipping */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: coords.openUp ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.openUp ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.openUp ? undefined : coords.top,
                  bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
                  left: coords.left,
                  width: coords.width,
                  zIndex: 99999,
                }}
                className={cn(
                  'rounded-2xl bg-[#141416]/95 backdrop-blur-xl border border-white/15',
                  'shadow-2xl shadow-black/90 p-1.5 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar'
                )}
              >
                {options.length === 0 ? (
                  <div className="px-3 py-3 text-center text-xs text-white/40 font-medium">
                    Không có lựa chọn nào
                  </div>
                ) : (
                  options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium',
                          'transition-all duration-150 text-left select-none outline-none',
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'text-white/80 hover:text-white hover:bg-white/[0.08] border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {option.icon ? (
                            option.icon
                          ) : option.value === '' ? (
                            <Disc className={cn('w-4 h-4 shrink-0', isSelected ? 'text-emerald-400' : 'text-white/40')} />
                          ) : (
                            <Music className={cn('w-4 h-4 shrink-0', isSelected ? 'text-emerald-400' : 'text-white/50')} />
                          )}
                          <div className="truncate">
                            <div className="truncate font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-[10px] text-white/40 truncate mt-0.5">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
