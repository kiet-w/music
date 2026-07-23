'use client';

import { useEffect } from 'react';

/**
 * Component to fix mobile keyboard issues using Visual Viewport API
 * This ensures the app layout adjusts correctly when the virtual keyboard appears/disappears
 */
export function ViewportFix() {
  useEffect(() => {
    const handleResize = () => {
      const vh = window.visualViewport 
        ? window.visualViewport.height 
        : window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Initial set
    handleResize();

    // Listen for viewport changes (keyboard open/close)
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return null;
}