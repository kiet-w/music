import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.CAPACITOR_SERVER_URL ||
  'http://localhost:3003';

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  server: {
    url: serverUrl,
    cleartext: true
  }
};

export default config;
