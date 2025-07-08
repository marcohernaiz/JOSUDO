import { google } from "googleapis";

class GoogleDriveService {
  private getDriveClient(credentials: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(JSON.parse(credentials));
    return google.drive({ version: "v3", auth });
  }

  async saveChatMessage(sessionId: string, userMessage: string, aiResponse: string, credentials: string) {
    try {
      const drive = this.getDriveClient(credentials);
      
      const fileName = `chat_session_${sessionId}.json`;
      const chatData = {
        timestamp: new Date().toISOString(),
        userMessage,
        aiResponse
      };

      // Try to find existing file
      const existingFiles = await drive.files.list({
        q: `name='${fileName}'`,
        fields: 'files(id, name)'
      });

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        // Update existing file
        const fileId = existingFiles.data.files[0].id;
        
        // Get current content
        const currentFile = await drive.files.get({
          fileId: fileId!,
          alt: 'media'
        });
        
        let currentData = [];
        try {
          currentData = JSON.parse(currentFile.data as string);
        } catch (e) {
          currentData = [];
        }
        
        currentData.push(chatData);
        
        await drive.files.update({
          fileId: fileId!,
          media: {
            mimeType: 'application/json',
            body: JSON.stringify(currentData, null, 2)
          }
        });
      } else {
        // Create new file
        await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: 'application/json'
          },
          media: {
            mimeType: 'application/json',
            body: JSON.stringify([chatData], null, 2)
          }
        });
      }
    } catch (error) {
      console.error('Google Drive save error:', error);
      throw new Error('Failed to save chat to Google Drive');
    }
  }

  async getChatHistory(sessionId: string, credentials: string) {
    try {
      const drive = this.getDriveClient(credentials);
      const fileName = `chat_session_${sessionId}.json`;
      
      const files = await drive.files.list({
        q: `name='${fileName}'`,
        fields: 'files(id, name)'
      });

      if (files.data.files && files.data.files.length > 0) {
        const fileId = files.data.files[0].id;
        const fileContent = await drive.files.get({
          fileId: fileId!,
          alt: 'media'
        });
        
        return JSON.parse(fileContent.data as string);
      }
      
      return [];
    } catch (error) {
      console.error('Google Drive read error:', error);
      throw new Error('Failed to read chat from Google Drive');
    }
  }

  async testCredentials(credentials: string): Promise<boolean> {
    try {
      const drive = this.getDriveClient(credentials);
      await drive.files.list({ pageSize: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
