import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleDriveService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async listFiles(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    
    console.log('Searching for MP3 files in Google Drive (including Shared Drives)...');
    try {
      const res = await drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, size, shortcutDetails, capabilities, driveId)',
        q: "trashed = false and (mimeType = 'audio/mpeg' or mimeType = 'application/vnd.google-apps.shortcut')",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      
      const files = res.data.files || [];
      console.log(`Successfully fetched ${files.length} total files from Drive.`);
      
      // Strictly filter for MP3 files or shortcuts to MP3 files
      const musicFiles = files.filter(file => {
        const name = file.name?.toLowerCase() || '';
        const mime = file.mimeType?.toLowerCase() || '';
        const isMp3Mime = mime === 'audio/mpeg' || mime === 'audio/mp3';
        const isMp3Ext = name.endsWith('.mp3');
        
        const isShortcutToMp3 = mime === 'application/vnd.google-apps.shortcut' && 
                                 (file.shortcutDetails?.targetMimeType === 'audio/mpeg' || 
                                  file.shortcutDetails?.targetMimeType === 'audio/mp3' ||
                                  name.endsWith('.mp3'));

        return isMp3Mime || isMp3Ext || isShortcutToMp3;
      });

      // Map shortcuts to their targets
      const resolvedFiles = musicFiles.map(file => {
        if (file.mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails?.targetId) {
          return {
            ...file,
            id: file.shortcutDetails.targetId,
            mimeType: file.shortcutDetails.targetMimeType || 'audio/mpeg',
            isShortcut: true
          };
        }
        return file;
      });

      console.log(`Filtered down to ${resolvedFiles.length} music files.`);
      return resolvedFiles;
    } catch (error: any) {
      console.error('CRITICAL ERROR in listFiles:');
      if (error.response) {
        console.error('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error Message:', error.message);
      }
      throw error;
    }
  }

  async getFileMetadata(accessToken: string, fileId: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const res = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
      supportsAllDrives: true,
    });
    return res.data;
  }

  async downloadFile(accessToken: string, fileId: string): Promise<any> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const res = await drive.files.get(
      { 
        fileId, 
        alt: 'media',
        supportsAllDrives: true,
        acknowledgeAbuse: true
      },
      { responseType: 'stream' },
    );
    return res.data;
  }
}
