import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  server: {
    url: 'http://192.168.240.1:3003',
    cleartext: true
  }
};

export default config;
