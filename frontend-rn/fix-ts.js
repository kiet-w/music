const fs = require('fs');

const detailPath = '/home/baudui/music-rn-foundation/frontend-rn/src/hooks/api/useAlbumDetail.ts';
let detail = fs.readFileSync(detailPath, 'utf8');
detail = detail.replace(/const id = searchParams\.get\('id'\) \|\| '';/, "const id = (searchParams.id as string) || '';");
fs.writeFileSync(detailPath, detail);

const drivePath = '/home/baudui/music-rn-foundation/frontend-rn/src/hooks/api/useGoogleDrive.ts';
let drive = fs.readFileSync(drivePath, 'utf8');
drive = drive.replace(/Alert\.alert\('Lỗi khởi tạo Google Drive: ' \+ err\.message, \{ id: 'drive-auth-error' \}\);/, "Alert.alert('Lỗi khởi tạo Google Drive: ' + err.message);");
drive = drive.replace(/Alert\.alert\('Lỗi: ' \+ err\.message, \{ id: 'drive-import-error' \}\);/, "Alert.alert('Lỗi: ' + err.message);");
fs.writeFileSync(drivePath, drive);

const chatPath = '/home/baudui/music-rn-foundation/frontend-rn/src/store/useChatStore.ts';
let chat = fs.readFileSync(chatPath, 'utf8');
chat = chat.replace(/const SOCKET_URL = 'https:\/\/music-backend-cb0i\.onrender\.com' \|\| API_URL;/, "const SOCKET_URL = 'https://music-backend-cb0i.onrender.com';");
fs.writeFileSync(chatPath, chat);
