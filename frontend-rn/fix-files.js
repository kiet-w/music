const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacers) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacers) {
        content = content.split(search).join(replace);
    }
    // Remove "use client" directives
    content = content.replace(/['"]use client['"];?\n?/g, '');
    fs.writeFileSync(filePath, content);
}

const rnDir = '/home/baudui/music-rn-foundation/frontend-rn/src';

// 2a. api.ts
let apiTs = fs.readFileSync(path.join(rnDir, 'lib/api.ts'), 'utf8');
apiTs = apiTs.replace(/const isServer = typeof window === 'undefined';/g, '');
apiTs = apiTs.replace(/['"]use client['"];?\n?/g, '');
// Remove 401 redirect block
apiTs = apiTs.replace(/if \(!isServer && typeof window !== 'undefined'\) \{[\s\S]*?localStorage\.getItem\('NEXT_LOCALE'\) \|\| 'en';[\s\S]*?window\.location\.href = `\/\$\{locale\}\/login`;\s*\}/g, 'useAuthStore.getState().clearSession();');
// Hardcode PRODUCTION_API_URL
apiTs = apiTs.replace(/process\.env\.NEXT_PUBLIC_PRODUCTION_API_URL \|\| 'https:\/\/music-backend-cb0i\.onrender\.com'/g, "'https://music-backend-cb0i.onrender.com'");
apiTs = apiTs.replace(/process\.env\.NEXT_PUBLIC_LOCAL_API_URL/g, "'https://music-backend-cb0i.onrender.com'"); // Just point to prod for now
apiTs = apiTs.replace(/const isNative = false;/g, 'const isNative = true;');
// Remove cache: 'no-store'
apiTs = apiTs.replace(/cache: 'no-store',?/g, '');
fs.writeFileSync(path.join(rnDir, 'lib/api.ts'), apiTs);

// 2e. useAuthStore.ts
replaceInFile(path.join(rnDir, 'store/useAuthStore.ts'), [
    ['localStorage.setItem', 'AsyncStorage.setItem'],
    ['localStorage.getItem', 'AsyncStorage.getItem'],
    ['localStorage.removeItem', 'AsyncStorage.removeItem'],
    ['typeof window !== \'undefined\'', 'true'],
    ['import { create }', "import { create } from 'zustand';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"]
]);
// AsyncStorage methods return promises, so any synchronous `getItem` checking needs fixing if used directly in state init? Actually zustand with AsyncStorage usually uses persist. Wait, useAuthStore uses zustand? Let's check how it uses localStorage.

// 2g. useChatStore.ts
replaceInFile(path.join(rnDir, 'store/useChatStore.ts'), [
    ['process.env.NEXT_PUBLIC_SOCKET_URL', "'https://music-backend-cb0i.onrender.com'"]
]);

// 2h. useAlbumStore.ts (just remove use client, handled in replaceInFile)
replaceInFile(path.join(rnDir, 'store/useAlbumStore.ts'), []);

// 2i. useDownloadHistoryStore.ts
replaceInFile(path.join(rnDir, 'store/useDownloadHistoryStore.ts'), [
    ['createJSONStorage(() => localStorage)', 'createJSONStorage(() => AsyncStorage)'],
    ['import { create }', "import { create } from 'zustand';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"]
]);

// 2j. API hooks
const hookFiles = fs.readdirSync(path.join(rnDir, 'hooks/api')).filter(f => f.endsWith('.ts'));
for (const file of hookFiles) {
    replaceInFile(path.join(rnDir, 'hooks/api', file), [
        ['next/navigation', 'expo-router']
    ]);
}
