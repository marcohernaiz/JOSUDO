import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/contexts/AppContext";
import { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const useChat = () => {
  // REMOVE: const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  // Use messages and setMessages from context
  const {
    activeSession,
    setActiveSession,
    messages,
    setMessages,
    currentSessionId,
    setCurrentSessionId,
    isAuthenticated,
    selectedModel,
    selectedPersona,
  } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      sessionId,
      files,
      persona,
    }: {
      message: string;
      sessionId?: string | number;
      files?: File[];
      persona?: any;
    }) => {
      // Use streaming for all requests
      return new Promise(async (resolve, reject) => {
        setIsStreaming(true);

        // Add user message immediately
        let messageContent = message;
        if (files && files.length > 0) {
          const fileList = files.map(f => `📎 ${f.name}`).join('\n');
          messageContent = message + (message ? '\n\n' : '') + `Attached files:\n${fileList}`;
        }

        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: messageContent,
          timestamp: new Date(),
        };

        // Add placeholder AI message for streaming
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          model: selectedModel,
        };

        setStreamingMessageId(aiMessageId);
        setMessages((prev) => [...prev, userMessage, aiMessage]);

        // Don't create session on client side - let server handle it
        // This prevents interference with the current chat state
        let finalSessionId = sessionId;

        // Prepare request data - convert files to base64 for simple handling
        let processedFiles: Array<{name: string, content: string, type: string}> = [];

        if (files && files.length > 0) {
          // Convert files to base64
          const filePromises = files.map(file => 
            new Promise<{name: string, content: string, type: string}>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get just the base64 content
                const base64Content = result.split(',')[1] || result;
                resolve({
                  name: file.name,
                  content: base64Content,
                  type: file.type
                });
              };
              reader.onerror = () => {
                console.error('Error reading file:', file.name);
                reject(new Error(`Failed to read file: ${file.name}`));
              };
              reader.readAsDataURL(file);
            })
          );

          try {
            processedFiles = await Promise.all(filePromises);
          } catch (error) {
            console.error('Error processing files:', error);
            // Continue with empty files if there's an error
          }
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        const body = JSON.stringify({
          message,
          sessionId: finalSessionId,
          model: selectedModel,
          files: processedFiles.length > 0 ? processedFiles : undefined,
          persona: persona,
        });

        // Use fetch with streaming for POST request
        fetch('/api/chat/send-stream', {
          method: 'POST',
          headers,
          credentials: 'include',
          body,
        }).then(async response => {
          if (!response.ok) {
            console.error('Network response not ok:', response.status, response.statusText);

            // Provide specific error messages for common issues
            let errorMessage = `Network response was not ok: ${response.status}`;
            if (response.status === 413) {
              errorMessage = 'File upload too large. Please reduce file size or number of files.';
            } else if (response.status === 400) {
              errorMessage = 'Bad request. Please check your files and try again.';
            }

            throw new Error(errorMessage);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is not readable');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          const readStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                  if (line.trim() === '') continue; // Skip empty lines

                  if (line.startsWith('data: ')) {
                    try {
                      const jsonStr = line.slice(6).trim();
                      if (jsonStr === '') continue; // Skip empty data

                      const data = JSON.parse(jsonStr);
                      console.log('Received streaming data:', data);

                      if (data.type === 'chunk') {
                        // Update the streaming message content
                        setMessages((prev) => 
                          prev.map((msg) => 
                            msg.id === aiMessageId 
                              ? { ...msg, content: msg.content + data.content }
                              : msg
                          )
                        );
                      } else if (data.type === 'complete') {
                        // Finalize the message
                        setMessages((prev) => 
                          prev.map((msg) => 
                            msg.id === aiMessageId 
                              ? { 
                                  ...msg, 
                                  content: data.response,
                                  tokens: data.tokens,
                                  cost: data.cost 
                                }
                              : msg
                          )
                        );
                        
                        // If we received a sessionId in the completion event, set it
                        if (data.sessionId && !currentSessionId) {
                          console.log("Setting currentSessionId from completion event:", data.sessionId);
                          setCurrentSessionId(data.sessionId as string);
                          // Invalidate chat history to refresh the list with a small delay to ensure Google Drive save is complete
                          setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/google-drive/chat-history"] });
                          }, 500);
                        }
                        
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        resolve(data);
                        return;
                      } else if (data.type === 'session_created') {
                        // Handle new session creation
                        console.log("New session created:", data.sessionId);
                        if (data.sessionId && !currentSessionId) {
                          setCurrentSessionId(data.sessionId);
                          // Invalidate chat history to refresh the list with a small delay to ensure Google Drive save is complete
                          setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/google-drive/chat-history"] });
                          }, 500);
                        }
                      } else if (data.type === 'error') {
                        throw new Error(data.error);
                      }
                    } catch (parseError) {
                      console.error('Error parsing SSE data:', parseError, 'Line:', line);
                    }
                  }
                }
              }
            } catch (streamError) {
              console.error('Streaming error:', streamError);
              reject(streamError);
            } finally {
              reader.releaseLock();
            }
          };

          await readStream();
        }).catch(error => {
          console.error('Fetch error:', error);
          setIsStreaming(false);
          setStreamingMessageId(null);
          reject(error);
        });
      });
    },
    onSuccess: (data: any) => {
      console.log("Streaming chat completed:", data);
      // Don't clear current message here since we clear it immediately when sending

      // Update active session if new session created
      if (data.sessionId && !activeSession) {
        console.log("New session created in onSuccess, invalidating chat history");
        queryClient.invalidateQueries({ queryKey: ["/api/google-drive/chat-history"] });
      }

      // Always refresh the current chat session to get updated content
      if (currentSessionId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/google-drive/chat-session", currentSessionId] 
        });
      }

      // Refresh usage data and credit balance after each message
      queryClient.invalidateQueries({ queryKey: ['usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
    },
    onError: (error: any) => {
      setIsStreaming(false);
      setStreamingMessageId(null);
      toast({
        title: "Message Failed",
        description:
          error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = async (files?: File[], message?: string) => {
    const messageToSend = message || currentMessage;
    if (!messageToSend.trim() && (!files || files.length === 0)) return;

    console.log("Sending message with sessionId:", currentSessionId);
    console.log("Sending message with persona:", selectedPersona?.name || 'Default JOSUDO AI');

    sendMessageMutation.mutate({
      message: messageToSend,
      sessionId: currentSessionId || undefined,
      files,
      persona: selectedPersona,
    });
  };

  const clearChat = () => {
    setMessages([]);
    setActiveSession(null);
    setCurrentSessionId(null);
  };

  return {
    messages,
    currentMessage,
    setCurrentMessage,
    sendMessage,
    clearChat,
    isLoading: sendMessageMutation.isPending || isStreaming,
    isStreaming,
    streamingMessageId,
  };
};