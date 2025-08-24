import { useChat } from "@/hooks/useChat";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/types";
import { useEffect, useRef, useState } from "react";

// Component to render message content with image detection
const MessageContent: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Enhanced regex to detect various image URL formats
  const imageUrlRegex = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|tiff)(?:\?[^\s]*)?/gi;
  
  // Markdown image pattern: ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  // Also detect common AI image generation patterns
  const aiImagePatterns = [
    /https?:\/\/[^\s]*(?:replicate|openai|midjourney|dalle|stablediffusion|huggingface)[^\s]*\.(?:png|jpg|jpeg|gif|webp)/gi,
    /https?:\/\/[^\s]*\/[^\s]*\.(?:png|jpg|jpeg|gif|webp)/gi,
    /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/gi
  ];

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set([...prev, url]));
  };

  const renderContentWithImages = (text: string) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    // Find all image URLs
    const allMatches: Array<{ url: string; index: number; length: number; alt?: string; isMarkdown?: boolean }> = [];
    
    // Check markdown images first (![alt](url))
    let markdownMatch;
    while ((markdownMatch = markdownImageRegex.exec(text)) !== null) {
      allMatches.push({
        url: markdownMatch[2],
        index: markdownMatch.index,
        length: markdownMatch[0].length,
        alt: markdownMatch[1],
        isMarkdown: true
      });
    }
    
    // Check main image regex
    let match;
    while ((match = imageUrlRegex.exec(text)) !== null) {
      // Skip if this URL is already captured by markdown
      const isAlreadyCaptured = allMatches.some(m => m.url === match[0]);
      if (!isAlreadyCaptured) {
        allMatches.push({
          url: match[0],
          index: match.index,
          length: match[0].length
        });
      }
    }
    
    // Check AI image patterns
    aiImagePatterns.forEach(pattern => {
      let aiMatch;
      while ((aiMatch = pattern.exec(text)) !== null) {
        // Skip if this URL is already captured
        const isAlreadyCaptured = allMatches.some(m => m.url === aiMatch[0]);
        if (!isAlreadyCaptured) {
          allMatches.push({
            url: aiMatch[0],
            index: aiMatch.index,
            length: aiMatch[0].length
          });
        }
      }
    });
    
    // Sort matches by index and remove duplicates
    const uniqueMatches = allMatches
      .filter((match, index, arr) => 
        arr.findIndex(m => m.url === match.url) === index
      )
      .sort((a, b) => a.index - b.index);
    
    uniqueMatches.forEach((match, i) => {
      // Add text before image
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <span key={`text-${i}`} className="whitespace-pre-wrap">
              {textBefore}
            </span>
          );
        }
      }
      
      // Add image
      if (!imageErrors.has(match.url)) {
        parts.push(
          <div key={`img-${i}`} className="my-3">
            <img
              src={match.url}
              alt={match.alt || "Generated image"}
              className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-600 shadow-md"
              onError={() => handleImageError(match.url)}
              loading="lazy"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{match.alt && `${match.alt} • `}AI Generated Image</span>
              <a 
                href={match.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-500 underline"
              >
                View full size
              </a>
            </div>
          </div>
        );
      } else {
        // Show link if image failed to load
        parts.push(
          <div key={`link-${i}`} className="my-2">
            <a 
              href={match.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline text-sm"
            >
              🖼️ {match.alt || "View image"}: {match.url}
            </a>
          </div>
        );
      }
      
      lastIndex = match.index + match.length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <span key="text-end" className="whitespace-pre-wrap">
            {remainingText}
          </span>
        );
      }
    }
    
    // If no images found, return original text
    if (parts.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }
    
    return <>{parts}</>;
  };

  return (
    <div className="prose prose-sm max-w-none">
      <div
        className={`text-sm ${
          isUser
            ? "text-slate-800 dark:text-slate-200"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {renderContentWithImages(content)}
      </div>
    </div>
  );
};

// Helper to map model IDs to display names
const getModelDisplayName = (modelId: string) => {
  switch (modelId) {
    case "deepseek-v3":
      return "Josudo AI";
    case "mixtral-8x7b":
      return "Mixtral (Free)";
    case "llama-3.1-8b":
      return "Llama 3.1 8B (Replicate)";
    case "gpt-4":
      return "ChatGPT (OpenAI GPT-4)";
    case "gpt-5":
      return "GPT-5 (Replicate)";
    case "claude-3-haiku-replicate":
      return "Claude 3 Haiku (Replicate)";
    case "claude-3-5-sonnet-replicate":
      return "Claude 3.5 Sonnet (Replicate)";
    case "claude-3-5-sonnet":
      return "Claude (Anthropic Direct)";
    case "gemini-pro":
      return "Gemini (Google)";
    case "llama-3":
      return "Llama 3 (Meta)";
    case "grok-beta":
      return "Grok (xAI)";
    default:
      return modelId;
  }
};

export const ChatArea: React.FC = () => {
  const { messages, isStreaming, streamingMessageId } = useChat();
  const { integrations, currentSessionId } = useAppContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  console.log("ChatArea render, messages:", messages);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100); // Small delay to ensure DOM is updated
    }
  }, [messages]);

  const selectModel = (model: string) => {
    // This would trigger model selection logic
    console.log("Selected model:", model);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Welcome to Josudo
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Start a new conversation or select a chat from your Google Drive
            history.
          </p>
          <div className="text-sm text-slate-500 dark:text-slate-500">
            Your conversations are automatically saved to Google Drive.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 px-6 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === "user"
                    ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl px-4 py-3"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="fas fa-robot text-primary"></i>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {message.model
                        ? getModelDisplayName(message.model)
                        : "AI"}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <Badge variant="secondary" className="text-xs">
                      {integrations.find(
                        (i) => i.serviceType === "ai_model" && i.isActive,
                      )
                        ? "Josudo AI"
                        : "Platform Routing"}
                    </Badge>
                  </div>
                )}

                {/* Show content with image rendering */}
                {message.content ? (
                  <MessageContent 
                    content={message.content} 
                    isUser={message.role === "user"} 
                  />
                ) : (
                  /* Show typing indicator for streaming messages */
                  isStreaming && streamingMessageId === message.id && (
                    <div className="flex items-center space-x-1 text-slate-500 mt-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs ml-2">AI is thinking...</span>
                    </div>
                  )
                )}

                <div
                  className={`flex items-center justify-between mt-3 ${
                    message.role === "user"
                      ? "text-primary-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <div className="text-xs">
                    {message.timestamp.toLocaleTimeString()}
                    {message.tokens && ` • ${message.tokens} tokens`}
                  </div>
                  {message.role === "assistant" && (
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
    </div>
  );
};
