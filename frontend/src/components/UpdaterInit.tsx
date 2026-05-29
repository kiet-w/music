'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App } from '@capacitor/app';

export function UpdaterInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Notify Capgo that the current update was successful
      void CapacitorUpdater.notifyAppReady();

      // Listen for app state changes to trigger updates
      const setupListener = async () => {
        await App.addListener('appStateChange', async (state) => {
          if (state.isActive) {
             console.log('App is active, checking for updates...');
             // Note: autoUpdate: true in capacitor.config.ts handles basic background updates.
          }
        });
      };
      
      void setupListener();
    }
  }, []);

  return null;
}
