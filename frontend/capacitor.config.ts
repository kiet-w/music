import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.CAPACITOR_SERVER_URL ||
  'https://viruses-pest-sauce-scratch.trycloudflare.com';

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
