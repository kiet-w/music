'use client';

import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
  }, []);

  return keyboardHeight;
}
