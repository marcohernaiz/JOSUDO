import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AI_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek', description: 'Free AI model', icon: 'fas fa-robot', isFree: true },
  { id: 'gpt-4', name: 'ChatGPT', description: 'OpenAI GPT-4', icon: 'fas fa-brain', isFree: false },
  { id: 'claude-3-5-sonnet', name: 'Claude', description: 'Anthropic Claude', icon: 'fas fa-sparkles', isFree: false },
  { id: 'gemini-pro', name: 'Gemini', description: 'Google Gemini Pro', icon: 'fas fa-star', isFree: false },
  { id: 'llama-3', name: 'Llama', description: 'Meta Llama 3', icon: 'fas fa-mountain', isFree: false },
  { id: 'grok-beta', name: 'Grok', description: 'xAI Grok', icon: 'fas fa-lightning', isFree: false },
];

export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading } = useChat();
  const { integrations } = useAppContext();
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || isLoading) return;
    sendMessage(selectedModel);
  };

  const activeModel = integrations.find(i => i.serviceType === 'ai_model' && i.isActive);
  const activeStorage = integrations.find(i => i.serviceType === 'storage' && i.isActive);
  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

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
                {/* AI Model Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center space-x-2 text-sm bg-white border-2 border-blue-200 text-blue-800 hover:text-blue-900 hover:bg-blue-50 hover:border-blue-300 px-3 py-2 h-auto font-medium shadow-sm"
                    >
                      <i className={`${currentModelInfo.icon} text-blue-600 text-sm`}></i>
                      <span className="font-semibold">{currentModelInfo.name}</span>
                      {currentModelInfo.isFree && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 font-medium">
                          Free
                        </Badge>
                      )}
                      {!currentModelInfo.isFree && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 font-medium">
                          Premium
                        </Badge>
                      )}
                      <i className="fas fa-chevron-down text-xs text-blue-500"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 border-2 border-blue-100 shadow-lg">
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${
                          selectedModel === model.id 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <i className={`${model.icon} ${
                          model.isFree ? 'text-green-600' : 'text-blue-600'
                        } text-base`}></i>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-800">{model.name}</span>
                            {model.isFree && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 font-medium">
                                Free
                              </Badge>
                            )}
                            {!model.isFree && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 font-medium">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{model.description}</p>
                        </div>
                        {selectedModel === model.id && (
                          <i className="fas fa-check text-blue-600 text-sm bg-blue-100 p-1.5 rounded-full"></i>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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
