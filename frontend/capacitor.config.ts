import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.CAPACITOR_SERVER_URL ||
  'http://localhost:3003';

const isProduction = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'com.kietw.music',
  appName: 'music',
  webDir: 'out',
  server: {
    url: serverUrl,
    cleartext: !isProduction, // HTTPS only for production
    androidScheme: isProduction ? 'https' : 'http'
  },
  plugins: {
    Keyboard: {
      resize: 'ionic' as any, // Better compatibility with viewport fixes
      resizeOnFullScreen: true
    }
  }
};

export default config;
