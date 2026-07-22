'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (Capacitor.isNativePlatform()) {
      let isSubscribed = true;

      const showHandle = Keyboard.addListener('keyboardWillShow', (info) => {
        if (!isSubscribed) return;
        setKeyboardHeight(info.keyboardHeight);
        document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      const hideHandle = Keyboard.addListener('keyboardWillHide', () => {
        if (!isSubscribed) return;
        setKeyboardHeight(0);
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      });

      return () => {
        isSubscribed = false;
        showHandle.then((l) => l.remove()).catch(() => {});
        hideHandle.then((l) => l.remove()).catch(() => {});
      };
    } else {
      const updateViewport = () => {
        if (window.visualViewport) {
          const kh = window.innerHeight - window.visualViewport.height;
          const h = kh > 100 ? kh : 0;
          setKeyboardHeight(h);
          document.documentElement.style.setProperty('--keyboard-height', `${h}px`);
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewport);
        return () => window.visualViewport?.removeEventListener('resize', updateViewport);
      }
    }
  }, []);

  return keyboardHeight;
}
