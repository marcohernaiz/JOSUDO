import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";

interface GoogleDriveChatSession {
  id: string;
  title: string;
  modifiedTime: string;
  size?: string;
  fileId: string;
}

interface ChatMessage {
  timestamp: string;
  userMessage?: string;
  aiResponse?: string;
  content?: string;
  role?: "user" | "assistant";
}

interface GoogleDriveChatHistoryProps {
  onSwitchToChat?: () => void;
}

export const GoogleDriveChatHistory: React.FC<GoogleDriveChatHistoryProps> = ({ onSwitchToChat }) => {
  const {
    isAuthenticated,
    setMessages,
    messages,
    currentSessionId,
    setCurrentSessionId,
  } = useAppContext();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Reset selected session when messages are cleared (new chat started)
  React.useEffect(() => {
    if (messages.length === 0) {
      setSelectedSession(null);
    }
  }, [messages.length]);

  // Update selected session when currentSessionId changes
  React.useEffect(() => {
    if (currentSessionId) {
      setSelectedSession(currentSessionId);
    }
  }, [currentSessionId]);

  const {
    data: chatSessions,
    isLoading,
    error,
    refetch,
  } = useQuery<GoogleDriveChatSession[]>({
    queryKey: ["/api/google-drive/chat-history"],
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2000, // Refetch every 2 seconds to catch new sessions quickly
    queryFn: async () => {
      const response = await fetch("/api/google-drive/chat-history", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  });

  const { data: selectedChatContent, error: sessionError } = useQuery<
    ChatMessage[]
  >({
    queryKey: ["/api/google-drive/chat-session", selectedSession],
    enabled: !!selectedSession && isAuthenticated,
    queryFn: async () => {
      console.log(
        "Fetching chat session content for sessionId:",
        selectedSession,
      );
      const response = await fetch(
        `/api/google-drive/chat-session/${selectedSession}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Chat session fetch error:", response.status, errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Received chat session data:", data);
      console.log("Data structure:", JSON.stringify(data, null, 2));
      return data;
    },
  });

  const handleSessionClick = (sessionId: string) => {
    console.log("Clicking on session:", sessionId);
    setSelectedSession(sessionId);
    // Set currentSessionId to the selected session so new messages are saved to that file
    setCurrentSessionId(sessionId);
    console.log("Set currentSessionId to:", sessionId);
    // Switch to chat view to show the selected chat
    onSwitchToChat?.();
  };

  // Load chat content when selectedChatContent changes
  React.useEffect(() => {
    if (selectedChatContent && selectedSession) {
      console.log("Converting chat content to messages:", selectedChatContent);

      const messages = selectedChatContent
        .map((msg, index) => {
          // Handle different data structures
          if (msg.userMessage && msg.aiResponse) {
            // Google Drive format: { timestamp, userMessage, aiResponse }
            return [
              {
                id: `user-${index}`,
                role: "user" as const,
                content: msg.userMessage,
                timestamp: new Date(msg.timestamp),
              },
              {
                id: `assistant-${index}`,
                role: "assistant" as const,
                content: msg.aiResponse,
                timestamp: new Date(msg.timestamp),
              },
            ];
          } else if (msg.role && msg.content) {
            // Standard chat format: { role, content, timestamp }
            return {
              id: `${msg.role}-${index}`,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            };
          } else {
            // Fallback
            console.warn("Unknown message format:", msg);
            return null;
          }
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
        .flat();

      console.log("Converted messages:", messages);
      setMessages(messages);
    } else if (selectedSession && !selectedChatContent && selectedSession !== currentSessionId) {
      // Only clear messages if we're switching to a different session and it has no content yet
      // This prevents clearing messages for the current active session
      setMessages([]);
    }
  }, [selectedChatContent, selectedSession, setMessages, currentSessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (size?: string) => {
    if (!size) return "";
    const bytes = parseInt(size);
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Loading chat history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600 dark:text-red-400 mb-2">
          Failed to load chat history
        </div>
        <div className="text-xs text-red-500 mb-2">
          {error instanceof Error ? error.message : String(error)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="w-full"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600 dark:text-red-400 mb-2">
          Failed to load chat session
        </div>
        <div className="text-xs text-red-500 mb-2">
          {sessionError instanceof Error
            ? sessionError.message
            : String(sessionError)}
        </div>
      </div>
    );
  }

  if (!chatSessions || chatSessions.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          No chat history found in Google Drive
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="w-full"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      <div className="space-y-1 py-1">
        {chatSessions.map((session) => (
          <div
            key={session.id}
            className={`flex flex-col p-2 rounded cursor-pointer transition-colors ${
              selectedSession === session.id
                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
            onClick={() => handleSessionClick(session.id)}
            title={session.title}
          >
            <div className="flex items-center space-x-2">
              <span className="text-blue-500 text-lg flex-shrink-0">💬</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium">
                  {session.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  {formatDate(session.modifiedTime)}
                  {session.size && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{formatFileSize(session.size)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
