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
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="relative mb-6">
            <i className="fas fa-robot text-white text-6xl mb-6 opacity-90"></i>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-wide">Welcome to Josudo</h2>
          <p className="text-white/80 mb-8 text-xl font-light leading-relaxed">Your intelligent AI companion is ready to assist</p>
          <div className="flex items-center justify-center space-x-6 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">DeepSeek AI Ready</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Free Forever</span>
            </div>
          </div>
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
