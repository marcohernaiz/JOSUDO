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
  } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      sessionId,
      model,
    }: {
      message: string;
      sessionId?: string | number;
      model?: string;
    }) => {
      // Use streaming for all requests
      return new Promise((resolve, reject) => {
        setIsStreaming(true);
        
        // Add user message immediately
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: message,
          timestamp: new Date(),
        };

        // Add placeholder AI message for streaming
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          model: model || "deepseek-chat",
        };

        setStreamingMessageId(aiMessageId);
        setMessages((prev) => [...prev, userMessage, aiMessage]);

        // Setup EventSource for streaming
        const eventSource = new EventSource('/api/chat/send-stream', {
          // Note: EventSource doesn't support POST directly, so we'll use fetch with stream
        });

        // Use fetch with streaming for POST request
        fetch('/api/chat/send-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message,
            sessionId,
            model: model || "deepseek-chat",
          }),
        }).then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          const readStream = async () => {
            while (reader) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
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
                      setIsStreaming(false);
                      setStreamingMessageId(null);
                      resolve(data);
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError);
                  }
                }
              }
            }
          };

          readStream().catch(reject);
        }).catch(reject);
      });
    },
    onSuccess: (data: any) => {
      console.log("Streaming chat completed:", data);
      setCurrentMessage("");

      // Update active session if new session created
      if (data.sessionId && !activeSession) {
        queryClient.invalidateQueries({ queryKey: ["/api/google-drive/chat-history"] });
      }
      
      // Always refresh the current chat session to get updated content
      if (currentSessionId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/google-drive/chat-session", currentSessionId] 
        });
      }
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

  const sendMessage = async (model?: string) => {
    if (!currentMessage.trim()) return;

    console.log("Sending message with sessionId:", currentSessionId);

    sendMessageMutation.mutate({
      message: currentMessage,
      sessionId: currentSessionId || undefined,
      model,
    });
  };

  const clearChat = () => {
    setMessages([]);
    setActiveSession(null);
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
