const fs = require('fs');

const authPath = '/home/baudui/music-rn-foundation/frontend-rn/src/store/useAuthStore.ts';
let authContent = fs.readFileSync(authPath, 'utf8');
authContent = authContent.replace('stored = AsyncStorage.getItem(AUTH_STORAGE_KEY);', 'stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);');
authContent = authContent.replace(/export function getEffectiveAccessToken\(\): string \| null \{[\s\S]*?catch \{[\s\S]*?\}[\s\S]*?\}/, `export function getEffectiveAccessToken(): string | null {
  const storeToken = useAuthStore.getState().accessToken;
  return storeToken || null;
}`);
fs.writeFileSync(authPath, authContent);

const chatStorePath = '/home/baudui/music-rn-foundation/frontend-rn/src/store/useChatStore.ts';
let chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');
chatStoreContent = chatStoreContent.replace(/if \(true\) \{/g, 'if (typeof window !== "undefined") {');
fs.writeFileSync(chatStorePath, chatStoreContent);
