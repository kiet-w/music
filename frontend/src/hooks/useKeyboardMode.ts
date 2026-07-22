'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

export function useKeyboardMode(mode: 'none' | 'body' | 'native' | 'ionic') {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let targetMode = KeyboardResize.None;
      if (mode === 'body') targetMode = KeyboardResize.Body;
      else if (mode === 'native') targetMode = KeyboardResize.Native;
      else if (mode === 'ionic') targetMode = KeyboardResize.Ionic;

      Keyboard.setResizeMode({ mode: targetMode }).catch((err) => {
        console.error('Failed to set Keyboard resize mode:', err);
      });
    }
  }, [mode]);
}
