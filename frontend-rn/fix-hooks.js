const fs = require('fs');
const path = require('path');

const hooksDir = '/home/baudui/music-rn-foundation/frontend-rn/src/hooks/api';
const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));

for (const file of hookFiles) {
    let content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
    
    // Replace next/navigation
    content = content.replace(/['"]next\/navigation['"]/g, "'expo-router'");

    // Replace useSearchParams with useLocalSearchParams
    content = content.replace(/useSearchParams/g, 'useLocalSearchParams');

    // Remove use client
    content = content.replace(/['"]use client['"];?\n?/g, '');

    // Remove next-intl
    content = content.replace(/import \{ useTranslations \} from ['"]next-intl['"];?\n?/g, '');
    content = content.replace(/const t = useTranslations\([^)]*\);\n?/g, 'const t = (key: string) => key;\n');
    // For t('...'), replace carefully. Look for exactly \bt\(
    content = content.replace(/\bt\((['"][^'"]+['"])\)/g, '$1');

    // Replace sonner with react-native Alert
    content = content.replace(/import \{ toast \} from ['"]sonner['"];?\n?/g, "import { Alert } from 'react-native';\n");
    content = content.replace(/toast\.error/g, 'Alert.alert');
    content = content.replace(/toast\.success/g, 'Alert.alert');
    content = content.replace(/toast\(/g, 'Alert.alert(');

    // Remove specific local imports that might be missing
    content = content.replace(/import type \{ User \} from ['"]@\/components\/features\/chat\/sidebar\/UserList['"];?\n?/g, "type User = any;\n");

    fs.writeFileSync(path.join(hooksDir, file), content);
}
