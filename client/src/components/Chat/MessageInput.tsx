import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading } = useChat();
  const { integrations } = useAppContext();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || isLoading) return;
    sendMessage();
  };

  const activeModel = integrations.find(i => i.serviceType === 'ai_model' && i.isActive);
  const activeStorage = integrations.find(i => i.serviceType === 'storage' && i.isActive);

  return (
    <div className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="resize-none border-slate-300 focus:ring-primary focus:border-primary pr-12"
                rows={1}
                style={{ 
                  minHeight: '44px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 h-8 w-8"
                size="sm"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <i className="fas fa-paper-plane text-sm"></i>
                )}
              </Button>
            </div>
            
            {/* Input Footer */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-robot text-primary text-sm"></i>
                  <span className="text-sm text-slate-600">
                    {activeModel?.serviceName || 'No model connected'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-cloud text-blue-500 text-sm"></i>
                  <span className="text-sm text-slate-600">
                    {activeStorage?.serviceName || 'No storage connected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  <i className="fas fa-cog mr-1"></i>Advanced
                </Button>
                <span className="text-sm text-slate-400">•</span>
                <span className="text-sm text-slate-500">Press Enter to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
