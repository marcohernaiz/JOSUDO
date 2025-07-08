import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAppContext } from '@/contexts/AppContext';
import { ChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const { activeSession, setActiveSession } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId, model }: { message: string; sessionId?: number; model?: string }) => {
      const response = await apiRequest('POST', '/api/chat/send', {
        message,
        sessionId,
        model: model || 'deepseek-chat'
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: currentMessage,
        timestamp: new Date(),
      };

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        tokens: data.tokensUsed || data.tokens,
        cost: data.cost,
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setCurrentMessage('');

      // Update active session if new session created
      if (data.sessionId && !activeSession) {
        // Refresh chat sessions to get the new session
        queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Message Failed',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const sendMessage = async (model?: string) => {
    if (!currentMessage.trim()) return;

    sendMessageMutation.mutate({
      message: currentMessage,
      sessionId: activeSession?.id,
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
    isLoading: sendMessageMutation.isPending,
  };
};
