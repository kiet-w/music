'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let showListener: any;
    let hideListener: any;

    if (Capacitor.isNativePlatform()) {
      showListener = Keyboard.addListener('keyboardWillShow', () => {
        setIsKeyboardVisible(true);
      });
      hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsKeyboardVisible(false);
      });
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardVisible(false);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (showListener) showListener.remove();
      if (hideListener) hideListener.remove();
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return isKeyboardVisible;
}
