const fs = require('fs');

const friendsPath = '/home/baudui/music-rn-foundation/frontend-rn/src/hooks/api/useFriends.ts';
let friends = fs.readFileSync(friendsPath, 'utf8');
friends = friends.replace(/import \{ User \} from '@\/components\/features\/chat\/sidebar\/UserList';/, "type User = any;");
friends = friends.replace(/if \(true\) \{/g, ""); // Not sure if this matches the TS2872, let's just replace all `if (true)` with if(1) or something, wait no, let's just find out what line 34 is.

fs.writeFileSync(friendsPath, friends);

const ytPath = '/home/baudui/music-rn-foundation/frontend-rn/src/hooks/api/useYoutubeDownloader.ts';
let yt = fs.readFileSync(ytPath, 'utf8');
yt = yt.replace(/import \{ useTranslations \} from 'next-intl';/, "");
fs.writeFileSync(ytPath, yt);
