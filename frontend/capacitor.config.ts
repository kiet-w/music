import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  server: {
    cleartext: true
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      resetWhenUpdate: false
    }
  }
};

export default config;
