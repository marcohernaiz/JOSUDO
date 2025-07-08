import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types';
import { useEffect, useRef } from 'react';

export const ChatArea: React.FC = () => {
  const { messages } = useChat();
  const { integrations } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  console.log('ChatArea render, messages:', messages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectModel = (model: string) => {
    // This would trigger model selection logic
    console.log('Selected model:', model);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="max-w-4xl mx-auto text-center">
          <i className="fas fa-robot text-primary text-4xl mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Josudo</h2>
          <p className="text-slate-600 mb-6">Start chatting with DeepSeek AI - completely free and ready to help!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-3xl ${
              message.role === 'user' 
                ? 'bg-primary text-white rounded-2xl px-4 py-3' 
                : 'bg-white border border-slate-200 rounded-2xl px-4 py-3'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fas fa-robot text-primary"></i>
                  <span className="text-xs font-medium text-slate-600">DeepSeek (Free)</span>
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
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <div className={`flex items-center justify-between mt-3 ${
                message.role === 'user' ? 'text-primary-100' : 'text-slate-400'
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
    </ScrollArea>
  );
};
