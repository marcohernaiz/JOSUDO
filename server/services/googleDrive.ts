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
  public getDriveClient(credentials: string) {
    const accessToken = JSON.parse(credentials).accessToken;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: "v3", auth });
  }

  private async getOrCreateJosudoFolder(credentials: string): Promise<string> {
    const drive = this.getDriveClient(credentials);
    const folderName = "Josudo";

    try {
      // First, try to find the existing Josudo folder
      const existingFolders = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
      });

      if (existingFolders.data.files && existingFolders.data.files.length > 0) {
        console.log("Found existing Josudo folder:", existingFolders.data.files[0].id);
        return existingFolders.data.files[0].id!;
      }

      // If folder doesn't exist, create it
      const folderMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      console.log("Created new Josudo folder:", folder.data.id);
      return folder.data.id!;
    } catch (error) {
      console.error("Error getting/creating Josudo folder:", error);
      throw new Error("Failed to get or create Josudo folder");
    }
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

      // Get the Josudo folder ID
      const folderId = await this.getOrCreateJosudoFolder(credentials);
      
      // First try to find existing file in the Josudo folder
      let existingFiles = await drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: "files(id, name)",
      });

      // If not found in Josudo folder, check root directory (backward compatibility)
      if (!existingFiles.data.files || existingFiles.data.files.length === 0) {
        existingFiles = await drive.files.list({
          q: `'root' in parents and name='${fileName}' and trashed=false`,
          fields: "files(id, name)",
        });
      }

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
            // Only use user messages for summary generation to avoid AI responses being used as titles
            const userMessages = currentData.messages.filter(msg => msg.role === "user");
            currentData.summary = await SummaryService.generateChatSummary(userMessages);
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
          // Only use user messages for summary generation to avoid AI responses being used as titles
          const userMessages = newData.messages.filter(msg => msg.role === "user");
          newData.summary = await SummaryService.generateChatSummary(userMessages);
        } catch (error) {
          console.error("Failed to generate initial summary:", error);
        }

        // Get or create the Josudo folder
        const folderId = await this.getOrCreateJosudoFolder(credentials);

        await drive.files.create({
          requestBody: {
            name: fileName,
            mimeType: "application/json",
            parents: [folderId], // Place file in Josudo folder
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

      // Get or create the Josudo folder
      const folderId = await this.getOrCreateJosudoFolder(credentials);

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
          parents: [folderId], // Place file in Josudo folder
        },
        media: {
          mimeType: "application/json",
          body: JSON.stringify(newSessionData, null, 2),
        },
      });

      console.log("Created new chat session in Josudo folder:", sessionId);
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

      // Get the Josudo folder ID
      const folderId = await this.getOrCreateJosudoFolder(credentials);
      
      // First try to find file in Josudo folder
      let files = await drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}'`,
        fields: "files(id, name)",
      });

      // If not found in Josudo folder, check root directory (backward compatibility)
      if (!files.data.files || files.data.files.length === 0) {
        files = await drive.files.list({
          q: `'root' in parents and name='${fileName}'`,
          fields: "files(id, name)",
        });
      }

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

      // Get the Josudo folder ID
      const folderId = await this.getOrCreateJosudoFolder(credentials);

      // Search for chat session files in the Josudo folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'chat_session_' and mimeType='application/json'`,
        fields: "files(id, name, modifiedTime, size)",
        orderBy: "modifiedTime desc",
        pageSize: 50,
      });

      let files = response.data.files || [];
      console.log("Found chat history files in Josudo folder:", files.length);

      // Also check for files in root directory (backward compatibility)
      const rootResponse = await drive.files.list({
        q: `'root' in parents and name contains 'chat_session_' and mimeType='application/json'`,
        fields: "files(id, name, modifiedTime, size)",
        orderBy: "modifiedTime desc",
        pageSize: 50,
      });

      const rootFiles = rootResponse.data.files || [];
      console.log("Found chat history files in root directory:", rootFiles.length);

      // Combine and sort by modified time
      const allFiles = [...files, ...rootFiles].sort((a, b) => {
        const timeA = new Date(a.modifiedTime || '').getTime();
        const timeB = new Date(b.modifiedTime || '').getTime();
        return timeB - timeA;
      });

      console.log("Total chat history files found:", allFiles.length);
      return allFiles;
    } catch (error) {
      console.error("Google Drive chat history error:", error);
      throw new Error(
        `Failed to fetch chat history: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getChatSessionSummary(sessionId: string, credentials: string, forceRegenerate: boolean = false): Promise<string> {
    try {
      const drive = this.getDriveClient(credentials);
      const fileName = `chat_session_${sessionId}.json`;

      // Get the Josudo folder ID
      const folderId = await this.getOrCreateJosudoFolder(credentials);

      // First try to find file in Josudo folder
      let files = await drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}'`,
        fields: "files(id, name)",
      });

      // If not found in Josudo folder, check root directory (backward compatibility)
      if (!files.data.files || files.data.files.length === 0) {
        files = await drive.files.list({
          q: `'root' in parents and name='${fileName}'`,
          fields: "files(id, name)",
        });
      }

      if (files.data.files && files.data.files.length > 0) {
        const fileId = files.data.files[0].id;
        if (!fileId) {
          return "Chat Session";
        }
        const fileContent = await drive.files.get({
          fileId,
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
              // Only use user messages for summary generation
              const userMessages = parsedContent.filter((msg: any) => msg.role === "user");
              const newSummary = await SummaryService.generateChatSummary(userMessages);
              
              // Update the file to new format with the generated summary
              if (fileId) {
                const updatedContent = {
                  messages: parsedContent,
                  summary: newSummary,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                
                await drive.files.update({
                  fileId: fileId as string,
                  media: {
                    mimeType: "application/json",
                    body: JSON.stringify(updatedContent, null, 2),
                  },
                });
              }
              
              return newSummary;
            } catch (error) {
              console.error("Failed to generate summary for old format:", error);
              return "Chat Session";
            }
          }
          return "New conversation";
        } else if (parsedContent.messages) {
          // New format - return stored summary or generate new one
          if (!forceRegenerate && parsedContent.summary && parsedContent.summary.length <= 25) {
            // Only use stored summary if it's reasonable length (25 chars or less) and not forcing regeneration
            return parsedContent.summary;
          } else if (parsedContent.messages.length > 0) {
            try {
              // Only use user messages for summary generation
              const userMessages = parsedContent.messages.filter((msg: any) => msg.role === "user");
              
              // Always regenerate summary if forcing regeneration, or if current one is problematic
              if (forceRegenerate || 
                  !parsedContent.summary || 
                  parsedContent.summary.length > 25 || 
                  parsedContent.summary.includes("Great question about AI and business") ||
                  parsedContent.summary.includes("Great question about AI") ||
                  parsedContent.summary.includes("Great question") ||
                  parsedContent.summary.includes("That's a great") ||
                  parsedContent.summary.includes("I'd be happy") ||
                  parsedContent.summary.includes("Let me help") ||
                  parsedContent.summary.includes("I can help") ||
                  parsedContent.summary.includes("That's an excellent") ||
                  parsedContent.summary.includes("Thank you for your") ||
                  parsedContent.summary.includes("I'm here to help") ||
                  parsedContent.summary.includes("I understand you're") ||
                  parsedContent.summary.includes("Your message:")) {
                
                const newSummary = await SummaryService.generateChatSummary(userMessages);
                
                // Update the file with the new summary
                parsedContent.summary = newSummary;
                if (fileId) {
                  await drive.files.update({
                    fileId: fileId as string,
                    media: {
                      mimeType: "application/json",
                      body: JSON.stringify(parsedContent, null, 2),
                    },
                  });
                }
                return newSummary;
              }
              
              return parsedContent.summary;
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
      
      // Get the Josudo folder ID
      const folderId = await this.getOrCreateJosudoFolder(credentials);
      
      // First try to find file in Josudo folder
      let files = await drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}'`,
        fields: "files(id, name)",
      });

      // If not found in Josudo folder, check root directory (backward compatibility)
      if (!files.data.files || files.data.files.length === 0) {
        files = await drive.files.list({
          q: `'root' in parents and name='${fileName}'`,
          fields: "files(id, name)",
        });
      }

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

  // Force regeneration of all chat session summaries
  async regenerateAllChatSummaries(credentials: string): Promise<{ success: number; failed: number }> {
    try {
      const drive = this.getDriveClient(credentials);
      const folderId = await this.getOrCreateJosudoFolder(credentials);
      
      // Get all chat session files
      const files = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'chat_session_' and mimeType='application/json'`,
        fields: "files(id, name)",
      });

      let successCount = 0;
      let failedCount = 0;

      if (files.data.files) {
        for (const file of files.data.files) {
          try {
            if (file.id && file.name) {
              // Force regeneration of summary for each file
              await this.getChatSessionSummary(file.name.replace('chat_session_', '').replace('.json', ''), credentials, true);
              successCount++;
            }
          } catch (error) {
            console.error(`Failed to regenerate summary for file ${file.name || 'unknown'}:`, error);
            failedCount++;
          }
        }
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error("Error regenerating all chat summaries:", error);
      throw new Error("Failed to regenerate chat summaries");
    }
  }
}

export const googleDriveService = new GoogleDriveService();
