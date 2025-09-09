import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import josudoIcon from '@assets/JOSUDO logo icon_1752491258890.png';
import voiceIcon from '@assets/voice-icon.svg';
import { PersonaSelectionModal } from './PersonaSelectionModal';

// Import organized avatars for path resolution
import executiveAssistantAvatar from '@assets/avatars/executive-assistant.gif';
import salesMarketingAvatar from '@assets/avatars/sales-marketing.gif';
import customerSupportAvatar from '@assets/avatars/customer-support.gif';
import elderlyCareAvatar from '@assets/avatars/elderly-care.gif';
import digitalBuddyAvatar from '@assets/avatars/digital-buddy.gif';
import aiGirlfriendAvatar from '@assets/avatars/ai-girlfriend.gif';

// Avatar mapping for asset imports
const avatarAssets: Record<string, string> = {
  'executive-assistant.gif': executiveAssistantAvatar,
  'sales-marketing.gif': salesMarketingAvatar,
  'customer-support.gif': customerSupportAvatar,
  'elderly-care.gif': elderlyCareAvatar,
  'digital-buddy.gif': digitalBuddyAvatar,
  'ai-girlfriend.gif': aiGirlfriendAvatar,
};

// Helper function to resolve avatar path to actual image URL
const resolveAvatarPath = (avatarPath: string): string => {
  if (!avatarPath) return executiveAssistantAvatar;
  
  // If it's an asset import path like @assets/avatars/filename
  if (avatarPath.startsWith('@assets/avatars/')) {
    const filename = avatarPath.replace('@assets/avatars/', '');
    return avatarAssets[filename] || executiveAssistantAvatar;
  }
  
  // If it's an API URL, use it directly
  if (avatarPath.startsWith('/api/avatar-library/')) {
    return avatarPath;
  }
  
  // If it's already a resolved asset path, use it
  return avatarPath;
};
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

// Add SpeechRecognition type definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const AI_MODELS = [
  { 
    id: 'deepseek-v3', 
    name: 'Josudo (DeepSeek V3)', 
    icon: () => <img src={josudoIcon} alt="Josudo" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(56%) sepia(74%) saturate(471%) hue-rotate(349deg) brightness(101%) contrast(101%)' }} />,
    pricing: { userKey: 'Not available', ourService: 'Free' },
    supportsUserKey: false
  },
  { 
    id: 'gpt-4', 
    name: 'GPT-4', 
    icon: SiOpenai,
    pricing: { userKey: 'Free with your key', ourService: '$0.002/1K tokens' },
    supportsUserKey: true
  },
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o', 
    icon: SiOpenai,
    pricing: { userKey: 'Free with your key', ourService: '$0.002/1K tokens' },
    supportsUserKey: true
  },
  { 
    id: 'claude-3-5-sonnet', 
    name: 'Claude 3.5 Sonnet', 
    icon: SiAnthropic,
    pricing: { userKey: 'Free with your key', ourService: '$0.002/1K tokens' },
    supportsUserKey: true
  },
  { 
    id: 'gemini-pro', 
    name: 'Gemini Pro', 
    icon: SiGoogle,
    pricing: { userKey: 'Free with your key', ourService: '$0.002/1K tokens' },
    supportsUserKey: true
  },
  { 
    id: 'grok-beta', 
    name: 'Grok-2', 
    icon: SiX,
    pricing: { userKey: 'Free with your key', ourService: '$0.002/1K tokens' },
    supportsUserKey: true
  },
  { 
    id: 'gpt-5', 
    name: 'GPT-5 (Replicate)', 
    icon: SiOpenai,
    pricing: { userKey: 'Not available', ourService: '$0.003/1K tokens' },
    supportsUserKey: false
  },
  { 
    id: 'llama-3.1-70b', 
    name: 'Llama 3.1 70B', 
    icon: SiMeta,
    pricing: { userKey: 'Not available', ourService: '$0.001/1K tokens' },
    supportsUserKey: false
  },
  { 
    id: 'claude-3-5-sonnet-replicate', 
    name: 'Claude 3.5 Sonnet (Replicate)', 
    icon: SiAnthropic,
    pricing: { userKey: 'Not available', ourService: '$0.002/1K tokens' },
    supportsUserKey: false
  },
  { 
    id: 'llama-3.1-8b', 
    name: 'Llama 3.1 8B', 
    icon: SiMeta,
    pricing: { userKey: 'Not available', ourService: '$0.001/1K tokens' },
    supportsUserKey: false
  },
];

const getStorageOptions = (isAuthenticated: boolean) => [
  { id: 'ipfs', name: 'IPFS', description: 'Decentralized storage', icon: SiIpfs, isConnected: false },
  { id: 'icloud', name: 'ICloud', description: 'Save to Apple iCloud', icon: SiIcloud, isConnected: false },
  { id: 'dropbox', name: 'Dropbox', description: 'Save to Dropbox', icon: SiDropbox, isConnected: false },
  { id: 'onedrive', name: 'OneDrive', description: 'Save to Microsoft OneDrive', icon: Cloud, isConnected: false },
  { id: 'google-drive', name: 'Google Drive', description: 'Save to Google Drive', icon: SiGoogledrive, isConnected: isAuthenticated },
];



export const MessageInput: React.FC = () => {
  const { currentMessage, setCurrentMessage, sendMessage, isLoading, messages } = useChat();
  const { integrations, selectedModel, setSelectedModel, setActiveSection, selectedPersona } = useAppContext();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedStorage, setSelectedStorage] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showAllModels, setShowAllModels] = useState(false);
  const [chatMode, setChatMode] = useState('assistant');
  const [showChatModeOptions, setShowChatModeOptions] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<'fast' | 'deep' | 'research'>('fast');
  const [webSearch, setWebSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const STORAGE_OPTIONS = getStorageOptions(isAuthenticated);

  // Check if user just connected storage or is authenticated
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('storage') === 'connected' || isAuthenticated) {
      setSelectedStorage('google-drive');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Hide auth notice when user becomes authenticated
    if (isAuthenticated) {
      setShowAuthNotice(false);
    }
  }, [isAuthenticated]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setCurrentMessage(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleDictation = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const handleStorageSelection = (storage: any) => {
    if (storage.id === 'google-drive' && !storage.isConnected) {
      // Trigger Google Sign-In for Google Drive
      window.location.href = '/api/auth/google?service=storage';
    } else {
      // For connected storage or other options, just select it
      setSelectedStorage(storage.id);
    }
  };

  const handleThinkingModeChange = (mode: 'fast' | 'deep' | 'research') => {
    setThinkingMode(mode);
    toast({
      title: "Thinking Mode Updated",
      description: `Switched to ${mode} thinking mode`,
    });
  };

  const handleWebSearchToggle = () => {
    setWebSearch(!webSearch);
    toast({
      title: "Web Search Toggled",
      description: `Web search ${!webSearch ? 'enabled' : 'disabled'}`,
    });
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

    sendMessage(filesToSend, messageToSend, thinkingMode, webSearch);
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

  // Function to check if user has API key for a specific model
  const hasUserApiKey = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model || !model.supportsUserKey) return false;
    
    // Map model IDs to provider names
    const providerMap: { [key: string]: string } = {
      'gpt-4': 'openai',
      'gpt-4o': 'openai',
      'claude-3-5-sonnet': 'anthropic',
      'gemini-pro': 'google',
      'grok-beta': 'xai'
    };
    
    const provider = providerMap[modelId];
    if (!provider) return false;
    
    return integrations.some(i => 
      i.serviceType === 'ai_model' && 
      i.serviceName === provider && 
      i.isActive
    );
  };
  const currentStorageInfo = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || { 
    id: 'none', 
    name: 'No Storage', 
    description: 'Select storage option', 
    icon: XCircle, 
    isConnected: false 
  };

  // Check if this is the first interaction (no messages sent yet)
  const hasMessages = messages.length > 0;

  return (
    <div className={`w-full max-w-4xl ${
      !hasMessages 
        ? 'MessageInput fixed bottom-8 z-20' 
        : 'relative mx-auto'
    }`}>

      <div className="ai-input-lines bg-slate-250/90 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/30 backdrop-blur-sm shadow-2xl w-full">
        {/* Authentication Notice */}
        
        {/* First Line - Input Box Only */}
        <div className="flex items-center justify-between w-full">
          <div className="relative flex-1">
            <input
              ref={(input) => {
                if (input && !hasMessages) {
                  setTimeout(() => input.focus(), 100);
                }
              }}
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={false}
              className={`w-full h-14 px-6 pr-32 border rounded-lg text-lg transition-colors ${
'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
              }`}
            />

            {/* Right side controls inside input */}
            <div className="absolute right-3 top-3 flex items-center space-x-1">
              {/* Thinking mode indicators */}
              {(thinkingMode !== 'fast' || webSearch) && (
                <div className="flex items-center space-x-1 mr-2">
                  {thinkingMode === 'deep' && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Brain className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Deep</span>
                    </div>
                  )}
                  {thinkingMode === 'research' && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Research</span>
                    </div>
                  )}
                  {webSearch && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Wifi className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Web</span>
                    </div>
                  )}
                </div>
              )}
              
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
                          onClick={handleDictation}
                          className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 p-0 ${
                            isListening 
                              ? 'bg-blue-500 hover:bg-blue-600 animate-slow-pulse' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Mic className={`h-4 w-4 ${
                            isListening 
                              ? 'text-white' 
                              : 'text-slate-600 dark:text-slate-300'
                          }`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isListening ? 'Stop dictation' : 'Start dictation'}</p>
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
                          <img src={voiceIcon} alt="Voice conversation" className="h-7 w-7" />
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
          <div className="mt-1.5 p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
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
        <div className="flex items-center justify-between w-full mt-2">
          {/* Left side - Tools */}
          <div className="flex items-center space-x-2">
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
                <DropdownMenuItem 
                  className={`p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 ${thinkingMode === 'deep' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                  onClick={() => handleThinkingModeChange('deep')}
                >
                  <Brain className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Think longer {thinkingMode === 'deep' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 ${thinkingMode === 'research' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                  onClick={() => handleThinkingModeChange('research')}
                >
                  <Zap className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Deep research {thinkingMode === 'research' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 ${webSearch ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                  onClick={handleWebSearchToggle}
                >
                  <Wifi className="w-4 h-4 mr-3 text-slate-600 dark:text-slate-400" />
                  Search web {webSearch && '✓'}
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
                    {selectedPersona ? (
                      <img 
                        src={resolveAvatarPath(selectedPersona.avatar || '')} 
                        alt={selectedPersona.name} 
                        className="w-10 h-10 rounded-full transition-transform duration-300 group-hover:scale-110" 
                      />
                    ) : (
                      <img src={josudoIcon} alt="Josudo" className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
                    )}
                    <span>
                      {selectedPersona ? `${selectedPersona.name} - ${selectedPersona.role}` : 'JOSUDO AI assistant'}
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
                      setShowPersonaModal(true);
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
          <div className="flex items-center space-x-2">
            {/* AI Model Selector */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ai-control-button h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 p-0 hover:bg-sky-100 dark:hover:bg-sky-800/30 hover:scale-105 group relative"
                    title={`AI Model: ${currentModelInfo.name} - ${hasUserApiKey(selectedModel) ? 'Using your API key (Free)' : currentModelInfo.pricing.ourService}`}
                  >
                    <currentModelInfo.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    {/* Pricing indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      hasUserApiKey(selectedModel) 
                        ? 'bg-green-500' 
                        : currentModelInfo.pricing.ourService === 'Free' 
                          ? 'bg-blue-500' 
                          : 'bg-orange-500'
                    }`} />
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
                  {(showAllModels ? AI_MODELS : AI_MODELS.slice(0, 6)).map((model) => {
                    const userHasKey = hasUserApiKey(model.id);
                    const currentPricing = userHasKey ? model.pricing.userKey : model.pricing.ourService;
                    
                    return (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className="p-3 cursor-pointer transition-all duration-200 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3">
                            <model.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <div className="flex items-center space-x-2 text-xs">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  userHasKey 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                  {userHasKey ? 'Your Key' : 'Our Service'}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  {currentPricing}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedModel === model.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
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
      
      {/* Persona Selection Modal */}
      <PersonaSelectionModal 
        isOpen={showPersonaModal} 
        onClose={() => setShowPersonaModal(false)} 
      />
    </div>
  );
};