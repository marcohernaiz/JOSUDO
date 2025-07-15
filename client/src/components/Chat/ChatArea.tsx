import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types';
import { useEffect, useRef } from 'react';

// Helper to map model IDs to display names
const getModelDisplayName = (modelId: string) => {
  switch (modelId) {
    case 'deepseek-r1':
      return 'DeepSeek R1 (Free)';
    case 'mixtral-8x7b':
      return 'Mixtral (Free)';
    case 'gpt-4':
      return 'ChatGPT (OpenAI GPT-4)';
    case 'claude-3-5-sonnet':
      return 'Claude (Anthropic)';
    case 'gemini-pro':
      return 'Gemini (Google)';
    case 'llama-3':
      return 'Llama 3 (Meta)';
    case 'grok-beta':
      return 'Grok (xAI)';
    default:
      return modelId;
  }
};

export const ChatArea: React.FC = () => {
  const { messages } = useChat();
  const { integrations } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  console.log('ChatArea render, messages:', messages);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100); // Small delay to ensure DOM is updated
    }
  }, [messages]);

  const selectModel = (model: string) => {
    // This would trigger model selection logic
    console.log('Selected model:', model);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        {/* Empty state - just show the space for messages */}
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 h-full px-6 overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${
              message.role === 'user' 
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl px-4 py-3' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-robot text-primary"></i>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {message.model ? getModelDisplayName(message.model) : "AI"}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <Badge variant="secondary" className="text-xs">
                    {integrations.find(i => i.serviceType === 'ai_model' && i.isActive) 
                      ? 'Premium Account' 
                      : 'Platform Routing'
                    }
                  </Badge>
                </div>
              )}
              
              <div className="prose prose-sm max-w-none">
                <p className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' 
                    ? 'text-slate-800 dark:text-slate-200' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {message.content}
                </p>
              </div>
              
              <div className={`flex items-center justify-between mt-3 ${
                message.role === 'user' ? 'text-primary-100' : 'text-slate-400 dark:text-slate-500'
              }`}>
                <div className="text-xs">
                  {message.timestamp.toLocaleTimeString()}
                  {message.tokens && ` • ${message.tokens} tokens`}
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-xs p-1">
                      <i className="fas fa-copy"></i>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs p-1">
                      <i className="fas fa-thumbs-up"></i>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
