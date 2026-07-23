import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true,
          androidScheme: 'https',
        },
      }
    : {
        server: {
          androidScheme: 'https',
        },
      }),
  plugins: {
    Keyboard: {
      resize: 'ionic' as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
