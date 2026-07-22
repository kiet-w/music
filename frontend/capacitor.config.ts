import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  server: {
    ...(serverUrl ? { url: serverUrl } : {}),
    cleartext: true
  }
};

export default config;
