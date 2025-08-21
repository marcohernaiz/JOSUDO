import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import josudoIcon from '@assets/JOSUDO logo icon_1752491258890.png';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Wrench, 
  Mic, 
  Headphones, 
  Video, 
  Settings, 
  Send,
  Bot,
  Brain,
  Sparkles,
  Star,
  Mountain,
  Zap,
  XCircle,
  HardDrive,
  Wifi,
  Bolt,
  Check,
  Cloud,
  Paperclip,
  FileText,
  Image,
  FileIcon,
  X
} from 'lucide-react';
import { 
  SiOpenai, 
  SiAnthropic, 
  SiGoogle, 
  SiMeta,
  SiX,
  SiAmazon,

  SiGoogledrive,
  SiIpfs,
  SiIcloud,
  SiDropbox
} from 'react-icons/si';

const AI_MODELS = [
  { id: 'deepseek-v3', name: 'Josudo', description: 'Advanced AI model', icon: () => <img src={josudoIcon} alt="Josudo" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(56%) sepia(74%) saturate(471%) hue-rotate(349deg) brightness(101%) contrast(101%)' }} />, isFree: true },
  { id: 'perplexity', name: 'Perplexity', description: 'Perplexity AI Search', icon: Brain, isFree: false },
  { id: 'grok-beta', name: 'Grok', description: 'xAI Grok', icon: SiX, isFree: false },
  { id: 'gemini-pro', name: 'Gemini', description: 'Google Gemini Pro', icon: SiGoogle, isFree: false },
  { id: 'claude-3-5-sonnet', name: 'Claude', description: 'Anthropic Claude Direct API', icon: SiAnthropic, isFree: false },
  { id: 'gpt-4', name: 'ChatGPT', description: 'OpenAI GPT-4', icon: SiOpenai, isFree: false },
  { id: 'claude-3-haiku-replicate', name: 'Claude 3 Haiku', description: 'Fast Claude via Replicate', icon: SiAnthropic, isFree: false },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', description: 'Meta Llama 3.1 8B via Replicate', icon: SiMeta, isFree: false },
  { id: 'claude-3-5-sonnet-replicate', name: 'Claude 3.5 Sonnet', description: 'Premium Claude via Replicate', icon: SiAnthropic, isFree: false },
  { id: 'gpt-5', name: 'GPT-5', description: 'OpenAI GPT-5 via Replicate', icon: SiOpenai, isFree: false },
  { id: 'llama-3', name: 'Llama', description: 'Meta Llama 3', icon: SiMeta, isFree: false },
];

const getStorageOptions = (isAuthenticated: boolean) => [
  { id: 'none', name: 'No Storage', description: 'Chat not saved', icon: XCircle, isConnected: false },
  { id: 'google-drive', name: 'Google Drive', description: 'Save to Google Drive', icon: SiGoogledrive, isConnected: isAuthenticated },
  { id: 'icloud', name: 'iCloud', description: 'Save to Apple iCloud', icon: SiIcloud, isConnected: false },
  { id: 'dropbox', name: 'Dropbox', description: 'Save to Dropbox', icon: SiDropbox, isConnected: false },
  { id: 'onedrive', name: 'OneDrive', description: 'Save to Microsoft OneDrive', icon: Cloud, isConnected: false },
  { id: 'ipfs', name: 'IPFS', description: 'Decentralized storage', icon: SiIpfs, isConnected: false },
];

const PROCESSING_PROVIDERS = [
  { id: 'josudo', name: 'Josudo', description: 'Free processing', icon: () => <img src={josudoIcon} alt="Josudo" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(56%) sepia(74%) saturate(471%) hue-rotate(349deg) brightness(101%) contrast(101%)' }} />, isFree: true },
  { id: 'aws', name: 'AWS', description: 'Amazon Web Services', icon: SiAmazon, isFree: false },
  { id: 'gcp', name: 'Google Cloud', description: 'Google Cloud Platform', icon: SiGoogle, isFree: false },
  { id: 'azure', name: 'Azure', description: 'Microsoft Azure', icon: Cloud, isFree: false },
];

export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading } = useChat();
  const { integrations } = useAppContext();
  const { isAuthenticated } = useAuth();
  const [selectedModel, setSelectedModel] = useState('deepseek-v3');
  const [selectedStorage, setSelectedStorage] = useState('none');
  const [selectedProcessing, setSelectedProcessing] = useState('josudo');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showAllModels, setShowAllModels] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const STORAGE_OPTIONS = getStorageOptions(isAuthenticated);

  // Check if user just connected storage or is authenticated
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('storage') === 'connected' || isAuthenticated) {
      setSelectedStorage('google-drive');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated]);

  const handleStorageSelection = (storage: any) => {
    if (storage.id === 'google-drive' && !storage.isConnected) {
      // Trigger Google Sign-In for Google Drive
      window.location.href = '/api/auth/google?service=storage';
    } else {
      // For connected storage or other options, just select it
      setSelectedStorage(storage.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if ((!currentMessage.trim() && attachedFiles.length === 0) || isLoading) return;
    sendMessage(selectedModel, attachedFiles);
    setAttachedFiles([]); // Clear files after sending
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Accept common file types
      const validTypes = [
        'text/plain', 'text/markdown', 'text/csv',
        'application/pdf', 
        'application/json',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/javascript', 'text/javascript',
        'text/html', 'text/css',
        'application/zip'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      // Note: Base64 encoding increases size by ~33%, so effective limit is lower
      const effectiveMaxSize = maxSize * 0.75; // ~7.5MB to account for base64 expansion
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|md|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|yaml|yml|json)$/i)) {
        alert(`File type not supported: ${file.name}`);
        return false;
      }
      
      if (file.size > effectiveMaxSize) {
        alert(`File too large: ${file.name}. Maximum size is ${Math.round(effectiveMaxSize / 1024 / 1024 * 10) / 10}MB (due to encoding overhead).`);
        return false;
      }
      
      return true;
    });
    
    setAttachedFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      
      // Check total payload size
      const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 20 * 1024 * 1024; // 20MB total limit
      
      if (totalSize > maxTotalSize) {
        alert(`Total file size too large. Please keep total under ${maxTotalSize / 1024 / 1024}MB.`);
        return prev; // Don't add the files
      }
      
      return newFiles;
    });
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.includes('pdf')) return FileText;
    if (file.type.includes('text/') || file.name.match(/\.(txt|md|js|ts|jsx|tsx|py|java|cpp|c|h|css|html|xml|yaml|yml|json)$/i)) return FileText;
    return FileIcon;
  };

  const activeModel = integrations.find(i => i.serviceType === 'ai_model' && i.isActive);
  const activeStorage = integrations.find(i => i.serviceType === 'storage' && i.isActive);
  const currentModelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]; // Default to Josudo
  const currentStorageInfo = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || STORAGE_OPTIONS[0];
  const currentProcessingInfo = PROCESSING_PROVIDERS.find(p => p.id === selectedProcessing) || PROCESSING_PROVIDERS[0];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="ai-input-lines bg-slate-250/90 dark:bg-slate-800/60 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/30 backdrop-blur-sm shadow-2xl w-full">
        {/* First Line - Input Box Only */}
        <div className="flex items-center justify-between w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full h-14 px-6 pr-14 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
            />
            
            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={(!currentMessage.trim() && attachedFiles.length === 0) || isLoading}
              className="absolute right-3 top-3 p-2 h-8 w-8 bg-blue-500 hover:bg-blue-600 rounded-md"
              size="sm"
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        </div>

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => {
                const FileIconComponent = getFileIcon(file);
                return (
                  <div key={index} className="flex items-center space-x-2 bg-white dark:bg-slate-600 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-500">
                    <FileIconComponent className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm text-slate-700 dark:text-slate-200 max-w-32 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Second Line - All Controls */}
        <div className="flex items-center justify-between w-full mt-4">
          {/* Left side - Tools */}
          <div className="flex items-center space-x-3">
            {/* File Upload */}
            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileAttach}
                className="ai-control-button h-10 w-10 group-hover:w-auto group-hover:px-4 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0"
                title="Attach files"
              >
                <Paperclip className="text-slate-600 dark:text-white text-lg flex-shrink-0 ml-3 group-hover:ml-0 w-4 h-4" />
                <span className="ml-2 text-sm text-slate-600 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">Add files</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml,.jpg,.jpeg,.png,.gif,.webp"
              />
            </div>

            {/* Tools */}
            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className="ai-control-button h-10 w-10 group-hover:w-auto group-hover:px-4 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0"
                title="Tools"
              >
                <span className="text-slate-600 dark:text-white text-lg flex-shrink-0 ml-3 group-hover:ml-0">🔧</span>
                <span className="ml-2 text-sm text-slate-600 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">Tools</span>
              </Button>
            </div>
          </div>

          {/* Center - AI Model, Storage, and Processing Selectors */}
          <div className="flex items-center space-x-4">
            {/* AI Model Selector */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ai-control-button px-4 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    title={`AI Model: ${currentModelInfo.name}`}
                  >
                    <currentModelInfo.icon className="text-sky-400 text-sm mr-2" />
                    <span className="text-xs text-slate-600 dark:text-white whitespace-nowrap">{currentModelInfo.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="ai-dropdown w-64">
                  {!showAllModels && (
                    <DropdownMenuItem
                      onClick={() => setShowAllModels(true)}
                      className="ai-dropdown-item group flex items-center justify-center p-3 cursor-pointer transition-all duration-300 rounded-lg mb-1 border-b border-slate-600 mb-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Plus className="text-sky-400 text-sm" />
                        <span className="font-medium text-white">Show more models</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {showAllModels && (
                    <DropdownMenuItem
                      onClick={() => setShowAllModels(false)}
                      className="ai-dropdown-item group flex items-center justify-center p-3 cursor-pointer transition-all duration-300 rounded-lg mb-1 border-b border-slate-600 mb-2"
                    >
                      <div className="flex items-center space-x-2">
                        <XCircle className="text-sky-400 text-sm" />
                        <span className="font-medium text-white">Show fewer models</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {(showAllModels ? AI_MODELS : AI_MODELS.slice(0, 7)).map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className="ai-dropdown-item group flex items-center justify-between p-3 cursor-pointer transition-all duration-300 rounded-lg mb-1"
                    >
                      <div className="flex items-center space-x-3">
                        <model.icon className="text-sky-400 text-sm" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white ai-model-name">{model.name}</span>
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
                          <p className="text-xs text-slate-300 group-hover:text-slate-100 mt-1 leading-relaxed ai-model-description">{model.description}</p>
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <span className="text-sky-400 text-sm">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Storage Selector */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ai-control-button px-4 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    title={`Storage: ${currentStorageInfo.name}`}
                  >
                    <currentStorageInfo.icon className="text-purple-400 text-sm mr-2" />
                    <span className="text-xs text-slate-600 dark:text-white whitespace-nowrap">{currentStorageInfo.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="ai-dropdown w-64">
                  {STORAGE_OPTIONS.map((storage) => (
                    <DropdownMenuItem
                      key={storage.id}
                      onClick={() => handleStorageSelection(storage)}
                      className="ai-dropdown-item group flex items-center justify-between p-3 cursor-pointer transition-all duration-300 rounded-lg mb-1"
                    >
                      <div className="flex items-center space-x-3">
                        <storage.icon className="text-purple-400 text-sm" />
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
                          <p className="text-xs text-slate-300 group-hover:text-slate-200 mt-1 leading-relaxed">{storage.description}</p>
                        </div>
                      </div>
                      {selectedStorage === storage.id && (
                        <span className="text-purple-400 text-sm">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Processing Provider Selector */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ai-control-button px-4 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                    title={`Processing: ${currentProcessingInfo.name}`}
                  >
                    <currentProcessingInfo.icon className="text-orange-400 text-sm mr-2" />
                    <span className="text-xs text-slate-600 dark:text-white whitespace-nowrap">{currentProcessingInfo.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="ai-dropdown w-64">
                  {PROCESSING_PROVIDERS.map((provider) => (
                    <DropdownMenuItem
                      key={provider.id}
                      onClick={() => setSelectedProcessing(provider.id)}
                      className="ai-dropdown-item group flex items-center justify-between p-3 cursor-pointer transition-all duration-300 rounded-lg mb-1"
                    >
                      <div className="flex items-center space-x-3">
                        <provider.icon className="text-orange-400 text-sm" />
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
                          <p className="text-xs text-slate-300 group-hover:text-slate-200 mt-1 leading-relaxed">{provider.description}</p>
                        </div>
                      </div>
                      {selectedProcessing === provider.id && (
                        <span className="text-orange-400 text-sm">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right side - Additional controls */}
          <div className="flex items-center space-x-3">
            {/* Voice input */}
            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className="ai-control-button h-10 w-10 group-hover:w-auto group-hover:px-4 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0"
                title="Voice input"
              >
                <span className="text-slate-600 dark:text-white text-lg flex-shrink-0 ml-3 group-hover:ml-0">🎤</span>
                <span className="ml-2 text-sm text-slate-600 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">Voice</span>
              </Button>
            </div>

            {/* Audio conversation */}
            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className="ai-control-button h-10 w-10 group-hover:w-auto group-hover:px-4 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0"
                title="Audio conversation"
              >
                <span className="text-slate-600 dark:text-white text-lg flex-shrink-0 ml-3 group-hover:ml-0">🎧</span>
                <span className="ml-2 text-sm text-slate-600 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">Audio</span>
              </Button>
            </div>

            {/* Video conferencing */}
            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className="ai-control-button h-10 w-10 group-hover:w-auto group-hover:px-4 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden p-0"
                title="Video conferencing"
              >
                <span className="text-slate-600 dark:text-white text-lg flex-shrink-0 ml-3 group-hover:ml-0">📹</span>
                <span className="ml-2 text-sm text-slate-600 dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto">Video</span>
              </Button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};