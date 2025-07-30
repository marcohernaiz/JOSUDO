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
    } catch (error) {
      return false;
    }
  }

  async listFiles(
    credentials: string,
    pageSize: number = 20,
    pageToken?: string,
  ) {
    try {
      const drive = this.getDriveClient(credentials);

      const response = await drive.files.list({
        pageSize,
        pageToken,
        fields:
          "nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, webViewLink)",
        orderBy: "modifiedTime desc",
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error("Google Drive list files error:", error);
      throw new Error("Failed to list Google Drive files");
    }
  }

  async getChatHistoryFiles(credentials: string) {
    try {
      console.log("Getting chat history files from Google Drive");
      const drive = this.getDriveClient(credentials);

      // Search for chat session files
      const response = await drive.files.list({
        q: "name contains 'chat_session_' and mimeType='application/json'",
        fields: "files(id, name, modifiedTime, size)",
        orderBy: "modifiedTime desc",
        pageSize: 50,
      });

      const files = response.data.files || [];
      console.log("Found chat history files:", files.length);
      return files;
    } catch (error) {
      console.error("Google Drive chat history error:", error);
      throw new Error(
        `Failed to fetch chat history: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getChatSessionContent(sessionId: string, credentials: string) {
    try {
      console.log("Getting chat session content for sessionId:", sessionId);
      const drive = this.getDriveClient(credentials);
      const fileName = `chat_session_${sessionId}.json`;

      console.log("Searching for file:", fileName);
      const files = await drive.files.list({
        q: `name='${fileName}'`,
        fields: "files(id, name)",
      });

      console.log("Found files:", files.data.files?.length || 0);

      if (files.data.files && files.data.files.length > 0) {
        const fileId = files.data.files[0].id;
        console.log("Getting file content for fileId:", fileId);

        const fileContent = await drive.files.get({
          fileId: fileId!,
          alt: "media",
        });

        console.log("File content type:", typeof fileContent.data);
        console.log("File content:", fileContent.data);

        // Handle both string and object responses
        let parsedContent;
        if (typeof fileContent.data === "string") {
          parsedContent = JSON.parse(fileContent.data);
        } else if (typeof fileContent.data === "object") {
          parsedContent = fileContent.data;
        } else {
          throw new Error(
            `Unexpected file content type: ${typeof fileContent.data}`,
          );
        }

        console.log("Parsed content, messages count:", parsedContent.length);
        return parsedContent;
      }

      console.log("No files found for sessionId:", sessionId);
      return [];
    } catch (error) {
      console.error("Google Drive get session content error:", error);
      throw new Error(
        `Failed to get chat session content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export const googleDriveService = new GoogleDriveService();
