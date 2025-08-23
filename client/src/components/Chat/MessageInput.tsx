import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import josudoIcon from '@assets/JOSUDO logo icon_1752491258890.png';
import voiceIcon from '@assets/voice-icon.svg';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus, 
  Wrench, 
  Mic, 
  Phone, 
  VideoIcon, 
  Settings, 
  Send,
  Square,
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
  X,
  Plug
} from 'lucide-react';
import { 
  SiOpenai, 
  SiAnthropic, 
  SiGoogle, 
  SiMeta,
  SiX,
  SiGoogledrive,
  SiIpfs,
  SiIcloud,
  SiDropbox
} from 'react-icons/si';

const AI_MODELS = [
  { id: 'perplexity', name: 'Perplexity', icon: Brain },
  { id: 'grok-beta', name: 'Grok 4.0', icon: SiX },
  { id: 'gemini-pro', name: 'Gemini 2.5+', icon: SiGoogle },
  { id: 'claude-3-5-sonnet', name: 'Claude 4.0', icon: SiAnthropic },
  { id: 'gpt-5', name: 'ChatGPT 5.0', icon: SiOpenai },
  { id: 'deepseek-v3', name: 'Josudo', icon: () => <img src={josudoIcon} alt="Josudo" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(56%) sepia(74%) saturate(471%) hue-rotate(349deg) brightness(101%) contrast(101%)' }} /> },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', icon: SiMeta },
  { id: 'gpt-4', name: 'ChatGPT 4.0', icon: SiOpenai },
  { id: 'claude-3-5-sonnet-replicate', name: 'Claude 3.5 Sonnet', icon: SiAnthropic },
  { id: 'llama-3', name: 'Llama 3', icon: SiMeta },
];

const getStorageOptions = (isAuthenticated: boolean) => [
  { id: 'ipfs', name: 'IPFS', description: 'Decentralized storage', icon: SiIpfs, isConnected: false },
  { id: 'icloud', name: 'ICloud', description: 'Save to Apple iCloud', icon: SiIcloud, isConnected: false },
  { id: 'dropbox', name: 'Dropbox', description: 'Save to Dropbox', icon: SiDropbox, isConnected: false },
  { id: 'onedrive', name: 'OneDrive', description: 'Save to Microsoft OneDrive', icon: Cloud, isConnected: false },
  { id: 'google-drive', name: 'Google Drive', description: 'Save to Google Drive', icon: SiGoogledrive, isConnected: isAuthenticated },
];



export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading } = useChat();
  const { integrations } = useAppContext();
  const { isAuthenticated } = useAuth();
  const [selectedModel, setSelectedModel] = useState('deepseek-v3');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showAllModels, setShowAllModels] = useState(false);
  const [chatMode, setChatMode] = useState('assistant');
  const [showChatModeOptions, setShowChatModeOptions] = useState(false);
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

    // Immediately clear input and files before sending
    const messageToSend = currentMessage;
    const filesToSend = [...attachedFiles];
    setCurrentMessage('');
    setAttachedFiles([]);

    sendMessage(selectedModel, filesToSend, messageToSend);
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
  const currentStorageInfo = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || { 
    id: 'none', 
    name: 'No Storage', 
    description: 'Select storage option', 
    icon: XCircle, 
    isConnected: false 
  };

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
              className="w-full h-14 px-6 pr-32 bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg"
            />

            {/* Right side controls inside input */}
            <div className="absolute right-3 top-3 flex items-center space-x-1">
              {currentMessage.trim() || attachedFiles.length > 0 ? (
                /* Send/Stop button when typing */
                <Button
                  onClick={handleSendMessage}
                  disabled={(!currentMessage.trim() && attachedFiles.length === 0) && !isLoading}
                  className={`p-2 h-8 w-8 rounded-md transition-colors ${
                    isLoading 
                      ? 'bg-black hover:bg-gray-800 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  size="sm"
                >
                  {isLoading ? (
                    <Square className="w-4 h-4 text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              ) : (
                /* Voice and video controls when not typing */
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Mic className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dictate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <img src={voiceIcon} alt="Voice conversation" className="h-8 w-8" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Voice conversation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <VideoIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Video conversation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileAttach}
                    className="ai-control-button h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 p-0 hover:bg-blue-100 dark:hover:bg-blue-800/30 hover:scale-105 group"
                  >
                    <Paperclip className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml,.jpg,.jpeg,.png,.gif,.webp"
              />
            </TooltipProvider>

            {/* Tools */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ai-control-button h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 p-0 hover:bg-orange-100 dark:hover:bg-orange-800/30 hover:scale-105 group"
                >
                  <Plus className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                <DropdownMenuItem className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Image className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Create image
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Brain className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Think longer
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Zap className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Deep research
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Wifi className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Search web
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center - Chat Mode Selector */}
          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <DropdownMenu open={showChatModeOptions} onOpenChange={setShowChatModeOptions}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="group h-10 px-4 rounded-full text-sm font-medium transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-200/50 dark:hover:shadow-purple-500/25 hover:scale-105 active:scale-95 shadow-md border border-indigo-300/50 dark:border-purple-400/30 flex items-center space-x-2 hover:border-indigo-400 dark:hover:border-purple-300 font-semibold"
                  >
                    <img src={josudoIcon} alt="Josudo" className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
                    <span>
                      JOSUDO AI assistant
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                  <DropdownMenuItem
                    onClick={() => {
                      setChatMode('assistant');
                      setShowChatModeOptions(false);
                    }}
                    className={`p-3 cursor-pointer transition-all duration-200 rounded-lg ${
                      chatMode === 'assistant'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Customize JOSUDO AI assistant
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setChatMode('library');
                      setShowChatModeOptions(false);
                    }}
                    className={`p-3 cursor-pointer transition-all duration-200 rounded-lg ${
                      chatMode === 'library'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Choose another Digital Persona
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right side - AI Model and Storage Selectors */}
          <div className="flex items-center space-x-3">
            {/* AI Model Selector */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ai-control-button h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 p-0 hover:bg-sky-100 dark:hover:bg-sky-800/30 hover:scale-105 group"
                    title={`AI Model: ${currentModelInfo.name}`}
                  >
                    <currentModelInfo.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                  {!showAllModels && (
                    <DropdownMenuItem
                      onClick={() => setShowAllModels(true)}
                      className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="font-medium">More models</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {(showAllModels ? AI_MODELS : AI_MODELS.slice(0, 6)).map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <model.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="font-medium">{model.name}</span>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="w-4 h-4 text-blue-500" />
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
                    className="ai-control-button h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 p-0 hover:bg-purple-100 dark:hover:bg-purple-800/30 hover:scale-105 group"
                    title={`Storage: ${currentStorageInfo.name}`}
                  >
                    <currentStorageInfo.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                  {STORAGE_OPTIONS.map((storage) => (
                    <DropdownMenuItem
                      key={storage.id}
                      onClick={() => handleStorageSelection(storage)}
                      className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <storage.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <div className="flex-1">
                          <span className="font-medium">{storage.name}</span>
                          {storage.isConnected && (
                            <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5 font-medium">
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedStorage === storage.id && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};