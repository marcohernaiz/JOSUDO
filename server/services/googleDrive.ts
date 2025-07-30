import { google } from "googleapis";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string; // optional, for debugging/logging
};

class GoogleDriveService {
  private getDriveClient(credentials: string) {
    const accessToken = JSON.parse(credentials).accessToken;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: "v3", auth });
  }

  // ✅ Save a new message pair (user + assistant) to history
  async saveChatMessage(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    credentials: string,
  ) {
    try {
      const drive = this.getDriveClient(credentials);
      const fileName = `chat_session_${sessionId}.json`;

      const userEntry: ChatMessage = {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      const aiEntry: ChatMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      // Try to find existing file
      const existingFiles = await drive.files.list({
        q: `name='${fileName}' and trashed=false`,
        fields: "files(id, name)",
      });

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        const fileId = existingFiles.data.files[0].id!;

        // Fetch the file content
        const currentFile = await drive.files.get({
          fileId,
          alt: "media",
        });

        let currentData: ChatMessage[] = [];

        if (Array.isArray(currentFile.data)) {
          currentData = currentFile.data;
        } else if (typeof currentFile.data === "string") {
          try {
            currentData = JSON.parse(currentFile.data);
          } catch {
            currentData = [];
          }
        } else {
          currentData = [];
        }

        // Append new entries
        currentData.push(userEntry, aiEntry);

        // Update the file
        await drive.files.update({
          fileId,
          media: {
            mimeType: "application/json",
            body: JSON.stringify(currentData, null, 2),
          },
        });
      } else {
        // Create new file if it doesn't exist
        await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: "application/json",
          },
          media: {
            mimeType: "application/json",
            body: JSON.stringify([userEntry, aiEntry], null, 2),
          },
        });
      }
    } catch (error) {
      console.error("Google Drive save error:", error);
      throw new Error("Failed to save chat to Google Drive");
    }
  }

  // ✅ Get full message history for a session
  async getChatHistory(
    sessionId: string,
    credentials: string,
  ): Promise<ChatMessage[]> {
    try {
      const drive = this.getDriveClient(credentials);
      const fileName = `chat_session_${sessionId}.json`;

      const files = await drive.files.list({
        q: `name='${fileName}'`,
        fields: "files(id, name)",
      });

      if (files.data.files && files.data.files.length > 0) {
        const fileId = files.data.files[0].id;
        const fileContent = await drive.files.get({
          fileId: fileId!,
          alt: "media",
        });

        let currentData: ChatMessage[] = [];
        //return JSON.parse(fileContent.data);
        if (typeof fileContent.data === "string") {
          try {
            currentData = JSON.parse(fileContent.data);
          } catch (e) {
            currentData = [];
          }
        } else if (Array.isArray(fileContent.data)) {
          currentData = fileContent.data;
        } else {
          currentData = [];
        }
        return currentData;
      }

      return [];
    } catch (error) {
      console.error("Google Drive read error:", error);
      throw new Error("Failed to read chat from Google Drive");
    }
  }

  async testCredentials(credentials: string): Promise<boolean> {
    try {
      const drive = this.getDriveClient(credentials);
      await drive.files.list({ pageSize: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
