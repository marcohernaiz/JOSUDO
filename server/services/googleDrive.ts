import { google } from "googleapis";
import { SummaryService } from "./summaryService";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string; // optional, for debugging/logging
};

type ChatSessionData = {
  messages: ChatMessage[];
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
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

        let currentData: ChatSessionData = {
          messages: [],
          summary: "New conversation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (typeof currentFile.data === "string") {
          try {
            const parsed = JSON.parse(currentFile.data);
            // Handle both old format (array) and new format (object)
            if (Array.isArray(parsed)) {
              currentData.messages = parsed;
            } else if (parsed.messages) {
              currentData = { ...currentData, ...parsed };
            }
          } catch {
            currentData.messages = [];
          }
        } else if (Array.isArray(currentFile.data)) {
          currentData.messages = currentFile.data;
        } else if (currentFile.data && typeof currentFile.data === "object") {
          currentData = { ...currentData, ...currentFile.data };
        }

        // Append new entries
        currentData.messages.push(userEntry, aiEntry);
        currentData.updatedAt = new Date().toISOString();

        // Generate summary if this is the first message or every 4 messages
        if (currentData.messages.length <= 2 || currentData.messages.length % 8 === 0) {
          try {
            currentData.summary = await SummaryService.generateChatSummary(currentData.messages);
          } catch (error) {
            console.error("Failed to generate summary:", error);
            // Keep existing summary or use fallback
            if (!currentData.summary) {
              currentData.summary = "New conversation";
            }
          }
        }

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
        const newData: ChatSessionData = {
          messages: [userEntry, aiEntry],
          summary: "New conversation",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Generate initial summary
        try {
          newData.summary = await SummaryService.generateChatSummary(newData.messages);
        } catch (error) {
          console.error("Failed to generate initial summary:", error);
        }

        await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: "application/json",
          },
          media: {
            mimeType: "application/json",
            body: JSON.stringify(newData, null, 2),
          },
        });
      }
    } catch (error) {
      console.error("Google Drive save error:", error);
      throw new Error("Failed to save chat to Google Drive");
    }
  }

  async createNewChatSession(credentials: string): Promise<string> {
    try {
      const drive = this.getDriveClient(credentials);

      // Generate a unique session ID using timestamp
      const sessionId = Date.now().toString();
      const fileName = `chat_session_${sessionId}.json`;

      // Create new empty chat session file with new format
      const newSessionData: ChatSessionData = {
        messages: [],
        summary: "New conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: JSON.stringify(newSessionData, null, 2),
        },
      });

      console.log("Created new chat session:", sessionId);
      return sessionId;
    } catch (error) {
      console.error("Google Drive create session error:", error);
      throw new Error("Failed to create new chat session");
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
        
        if (typeof fileContent.data === "string") {
          try {
            const parsed = JSON.parse(fileContent.data);
            // Handle both old format (array) and new format (object)
            if (Array.isArray(parsed)) {
              currentData = parsed;
            } else if (parsed.messages) {
              currentData = parsed.messages;
            }
          } catch (e) {
            currentData = [];
          }
        } else if (Array.isArray(fileContent.data)) {
          currentData = fileContent.data;
        } else if (fileContent.data && typeof fileContent.data === "object" && (fileContent.data as any).messages) {
          currentData = (fileContent.data as any).messages;
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

  async getChatSessionSummary(sessionId: string, credentials: string): Promise<string> {
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

        let parsedContent;
        if (typeof fileContent.data === "string") {
          parsedContent = JSON.parse(fileContent.data);
        } else if (typeof fileContent.data === "object") {
          parsedContent = fileContent.data;
        } else {
          return "Chat Session";
        }

        // Handle both old format (array) and new format (object)
        if (Array.isArray(parsedContent)) {
          // Old format - generate summary from messages
          if (parsedContent.length > 0) {
            try {
              return await SummaryService.generateChatSummary(parsedContent);
            } catch (error) {
              console.error("Failed to generate summary for old format:", error);
              return "Chat Session";
            }
          }
          return "New conversation";
        } else if (parsedContent.messages) {
          // New format - return stored summary or generate new one
          if (parsedContent.summary) {
            return parsedContent.summary;
          } else if (parsedContent.messages.length > 0) {
            try {
              return await SummaryService.generateChatSummary(parsedContent.messages);
            } catch (error) {
              console.error("Failed to generate summary for new format:", error);
              return "Chat Session";
            }
          }
          return "New conversation";
        }
      }

      return "Chat Session";
    } catch (error) {
      console.error("Error getting chat session summary:", error);
      return "Chat Session";
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

        // Handle both old format (array) and new format (object)
        let messages: ChatMessage[] = [];
        let summary = "Chat Session";
        
        if (Array.isArray(parsedContent)) {
          // Old format - just an array of messages
          messages = parsedContent;
        } else if (parsedContent.messages) {
          // New format - object with messages and summary
          messages = parsedContent.messages;
          summary = parsedContent.summary || "Chat Session";
        } else {
          messages = [];
        }

        console.log("Parsed content, messages count:", messages.length, "summary:", summary);
        
        // Return messages in the format expected by the frontend
        return messages.map((msg, index) => {
          const msgAny = msg as any;
          if (msgAny.userMessage && msgAny.aiResponse) {
            // Convert from Google Drive format to standard format
            return {
              timestamp: msg.timestamp || new Date().toISOString(),
              userMessage: msgAny.userMessage,
              aiResponse: msgAny.aiResponse,
            };
          } else {
            // Already in standard format
            return {
              timestamp: msg.timestamp || new Date().toISOString(),
              content: msg.content,
              role: msg.role,
            };
          }
        });
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
