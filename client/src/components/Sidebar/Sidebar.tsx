import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/Modals/SettingsModal";
import { BillingModal } from "@/components/Modals/BillingModal";
import { GoogleDriveChatHistory } from "@/components/Sidebar/GoogleDriveChatHistory";
import { useQueryClient } from "@tanstack/react-query";
import josudoLogo from "@assets/JOSUDO ICON_1752512850035.png";
import josudoText from "@assets/josudo logo just text_1752513004427.png";

interface SidebarProps {
  onClose?: () => void;
  onSwitchToChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, onSwitchToChat }) => {
  const { setActiveSession, setMessages, setCurrentSessionId } =
    useAppContext();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const createNewChat = async () => {
    try {
      if (isAuthenticated) {
        // Create a new chat session in Google Drive
        const response = await fetch("/api/google-drive/new-chat", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Created new chat session:", data.sessionId);
          setCurrentSessionId(data.sessionId);
          
          // Invalidate chat history to refresh the list
          queryClient.invalidateQueries({ queryKey: ["/api/google-drive/chat-history"] });
        } else {
          console.error("Failed to create new chat session");
        }
      }

      // Clear the active session
      setActiveSession(null);
      // Clear all messages to start fresh
      setMessages([]);
      // Switch to chat view
      onSwitchToChat?.();
      // Close sidebar on mobile
      onClose?.();
    } catch (error) {
      console.error("Error creating new chat:", error);
      // Still clear messages even if session creation fails
      setActiveSession(null);
      setMessages([]);
      // Switch to chat view
      onSwitchToChat?.();
      onClose?.();
    }
  };

  return (
    <>
      <div
        className={`h-full bg-slate-250 dark:bg-slate-900/80 border-r border-slate-300 dark:border-slate-700 flex flex-col transition-all duration-200 ${
          isExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-300 dark:border-slate-700">
          <div
            className={`flex items-center ${isExpanded ? "justify-between" : "flex-col"} mb-4`}
          >
            {!isExpanded ? (
              <div 
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"
                onClick={() => setIsExpanded(!isExpanded)}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                title="Expand sidebar"
              >
                {!isLogoHovered ? (
                  <>
                    <img
                      src={josudoLogo}
                      alt="Josudo Logo"
                      className="w-10 h-10 object-contain flex-shrink-0 josudo-logo-light"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = "block";
                      }}
                    />
                    <span className="text-amber-400 text-2xl hidden">⚜️</span>
                  </>
                ) : (
                  <svg 
                    className="w-5 h-5 text-slate-600 dark:text-slate-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img
                      src={josudoLogo}
                      alt="Josudo Logo"
                      className="w-10 h-10 object-contain flex-shrink-0 josudo-logo-light"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = "block";
                      }}
                    />
                    <span className="text-amber-400 text-2xl hidden">⚜️</span>
                  </div>
                  <img
                    src={josudoText}
                    alt="Josudo"
                    className="h-8 object-contain flex-shrink-0 josudo-text-light"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) nextElement.style.display = "inline";
                    }}
                  />
                  <span className="font-bold text-black dark:text-white hidden">
                    Josudo
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 w-8 h-8 p-0 flex items-center justify-center"
                  title="Collapse sidebar"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
                  </svg>
                </Button>
              </>
            )}
            
            {/* Mobile close button */}
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 ml-2"
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
          </div>

          <div className={`${isExpanded ? "" : "flex justify-center"}`}>
            <Button
              onClick={createNewChat}
              className={`${isExpanded ? "w-full" : "w-10 h-10 p-0"} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 flex items-center justify-center`}
              title={!isExpanded ? "New Chat" : ""}
            >
              <span className="text-white text-lg">+</span>
              {isExpanded && <span className="ml-2">New Chat</span>}
            </Button>
          </div>
        </div>

        {/* Active Configuration */}
        <div className="px-4 py-3 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
          {isExpanded && (
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              ACTIVE CONFIGURATION
            </div>
          )}
          <div className="space-y-2">
            <div
              className={`flex items-center ${isExpanded ? "space-x-2" : "justify-center"}`}
            >
              <span className="text-blue-400 text-2xl flex-shrink-0">🤖</span>
              {isExpanded && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Grok (Free)
                  </span>
                </>
              )}
            </div>
            <div
              className={`flex items-center ${isExpanded ? "space-x-2" : "justify-center"}`}
            >
              <span className="text-purple-400 text-2xl flex-shrink-0">💾</span>
              {isExpanded && (
                <>
                  <div
                    className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-green-500" : "bg-slate-500"}`}
                  ></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {isAuthenticated ? "Google Drive" : "No Storage"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Google Drive Chat History */}
        {isExpanded && <GoogleDriveChatHistory onSwitchToChat={onSwitchToChat} />}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-300 dark:border-slate-700">
          <div className={`${isExpanded ? "space-y-2" : "space-y-2"}`}>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className={`${isExpanded ? "flex-1 justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center`}
                title={!isExpanded ? "Settings" : ""}
              >
                <span className="text-slate-400 text-2xl">⚙️</span>
                {isExpanded && <span className="ml-2">Settings</span>}
              </Button>
            </div>
            {isAuthenticated && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/api/auth/logout")}
                  className={`${isExpanded ? "flex-1 justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center`}
                  title={!isExpanded ? "Sign Out" : ""}
                >
                  <span className="text-slate-400 text-2xl">🚪</span>
                  {isExpanded && <span className="ml-2">Sign Out</span>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <BillingModal open={showBilling} onClose={() => setShowBilling(false)} />
    </>
  );
};
