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

const STORAGE_OPTIONS = [
  { id: 'none', name: 'No Storage', description: 'Chat not saved', icon: 'fas fa-times-circle', isConnected: false },
  { id: 'google-drive', name: 'Google Drive', description: 'Save to Google Drive', icon: 'fab fa-google-drive', isConnected: false },
  { id: 'ipfs', name: 'IPFS', description: 'Decentralized storage', icon: 'fas fa-network-wired', isConnected: false },
];

const PROCESSING_PROVIDERS = [
  { id: 'josudo', name: 'Josudo', description: 'Free processing', icon: 'fas fa-bolt', isFree: true },
  { id: 'aws', name: 'AWS', description: 'Amazon Web Services', icon: 'fab fa-aws', isFree: false },
  { id: 'gcp', name: 'Google Cloud', description: 'Google Cloud Platform', icon: 'fab fa-google', isFree: false },
  { id: 'azure', name: 'Azure', description: 'Microsoft Azure', icon: 'fab fa-microsoft', isFree: false },
];

export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading } = useChat();
  const { integrations } = useAppContext();
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [selectedStorage, setSelectedStorage] = useState('none');
  const [selectedProcessing, setSelectedProcessing] = useState('josudo');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  const currentStorageInfo = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || STORAGE_OPTIONS[0];
  const currentProcessingInfo = PROCESSING_PROVIDERS.find(p => p.id === selectedProcessing) || PROCESSING_PROVIDERS[0];

  return (
    <div className="w-full">
      <div className="ai-input-lines bg-slate-800/60 rounded-xl p-4 border border-slate-700/30 backdrop-blur-sm shadow-2xl w-full">
        {/* First Line - Input Box Only */}
        <div className="relative">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="w-full h-12 px-4 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="absolute right-2 top-2 p-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-md"
            size="sm"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <i className="fas fa-paper-plane text-sm text-white"></i>
            )}
          </Button>
        </div>

        {/* Second Line - All Controls */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 flex-1">
            {/* File Upload */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Attach files"
            >
              <i className="fas fa-plus text-sm" style={{ fontSize: '12px' }}></i>
            </Button>

            {/* Tools */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Tools"
            >
              <i className="fas fa-wrench text-sm" style={{ fontSize: '12px' }}></i>
            </Button>

            {/* AI Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ai-control-button flex items-center space-x-2 text-sm px-3 py-2 h-auto font-medium shadow-sm"
                >
                  <i className={`${currentModelInfo.icon} text-sky-400 text-sm`}></i>
                  <span className="font-semibold">{currentModelInfo.name}</span>
                  {currentModelInfo.isFree && (
                    <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                      Free
                    </Badge>
                  )}
                  {!currentModelInfo.isFree && (
                    <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-medium">
                      Premium
                    </Badge>
                  )}
                  <i className="fas fa-chevron-down text-xs text-sky-400"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="ai-dropdown w-64">
                {AI_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className="ai-dropdown-item flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50"
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${model.icon} text-sky-400 text-sm`}></i>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{model.name}</span>
                          {model.isFree && (
                            <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                              Free
                            </Badge>
                          )}
                          {!model.isFree && (
                            <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-medium">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{model.description}</p>
                      </div>
                    </div>
                    {selectedModel === model.id && (
                      <i className="fas fa-check text-sky-400 text-sm bg-sky-400/20 p-1.5 rounded-full"></i>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Storage Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ai-control-button flex items-center space-x-2 text-sm px-3 py-2 h-auto font-medium shadow-sm"
                >
                  <i className={`${currentStorageInfo.icon} text-purple-400 text-sm`}></i>
                  <span className="font-semibold">{currentStorageInfo.name}</span>
                  {currentStorageInfo.isConnected ? (
                    <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border border-red-500/30 px-2 py-0.5 font-medium">
                      Disconnected
                    </Badge>
                  )}
                  <i className="fas fa-chevron-down text-xs text-purple-400"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="ai-dropdown w-64">
                {STORAGE_OPTIONS.map((storage) => (
                  <DropdownMenuItem
                    key={storage.id}
                    onClick={() => setSelectedStorage(storage.id)}
                    className="ai-dropdown-item flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50"
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${storage.icon} text-purple-400 text-sm`}></i>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{storage.name}</span>
                          {storage.isConnected ? (
                            <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-red-900/20 text-red-300 border border-red-500/30 px-2 py-0.5 font-medium">
                              Disconnected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{storage.description}</p>
                      </div>
                    </div>
                    {selectedStorage === storage.id && (
                      <i className="fas fa-check text-purple-400 text-sm bg-purple-400/20 p-1.5 rounded-full"></i>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Processing Provider Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ai-control-button flex items-center space-x-2 text-sm px-3 py-2 h-auto font-medium shadow-sm"
                >
                  <i className={`${currentProcessingInfo.icon} text-orange-400 text-sm`}></i>
                  <span className="font-semibold">{currentProcessingInfo.name}</span>
                  {currentProcessingInfo.isFree && (
                    <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                      Free
                    </Badge>
                  )}
                  {!currentProcessingInfo.isFree && (
                    <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-medium">
                      Premium
                    </Badge>
                  )}
                  <i className="fas fa-chevron-down text-xs text-orange-400"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="ai-dropdown w-64">
                {PROCESSING_PROVIDERS.map((provider) => (
                  <DropdownMenuItem
                    key={provider.id}
                    onClick={() => setSelectedProcessing(provider.id)}
                    className="ai-dropdown-item flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50"
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${provider.icon} text-orange-400 text-sm`}></i>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{provider.name}</span>
                          {provider.isFree && (
                            <Badge variant="secondary" className="ai-badge text-xs px-2 py-0.5 font-medium">
                              Free
                            </Badge>
                          )}
                          {!provider.isFree && (
                            <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 font-medium">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{provider.description}</p>
                      </div>
                    </div>
                    {selectedProcessing === provider.id && (
                      <i className="fas fa-check text-orange-400 text-sm bg-orange-400/20 p-1.5 rounded-full"></i>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Voice input */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Voice input"
            >
              <i className="fas fa-microphone text-sm" style={{ fontSize: '12px' }}></i>
            </Button>

            {/* Audio conversation */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Audio conversation"
            >
              <i className="fas fa-headphones text-sm" style={{ fontSize: '12px' }}></i>
            </Button>

            {/* Video conferencing */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Video conferencing"
            >
              <i className="fas fa-video text-sm" style={{ fontSize: '12px' }}></i>
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="ai-control-button p-2 h-8 w-8 rounded-full flex items-center justify-center"
              title="Settings"
            >
              <i className="fas fa-cog text-sm" style={{ fontSize: '12px' }}></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};