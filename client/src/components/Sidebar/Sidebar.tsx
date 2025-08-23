import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/Modals/SettingsModal";
import { BillingModal } from "@/components/Modals/BillingModal";
import { GoogleDriveChatHistory } from "@/components/Sidebar/GoogleDriveChatHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import josudoLogo from "@assets/JOSUDO ICON_1752512850035.png";
import josudoText from "@assets/josudo logo just text_1752513004427.png";
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Settings, 
  MessageSquare, 
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit,
  X,
  Loader2,
  BookOpen,
  Users,
  Wrench,
  History
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  onSwitchToChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, onSwitchToChat }) => {
  const { setActiveSession, setMessages, setCurrentSessionId, user } =
    useAppContext();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isPrivateSpaceExpanded, setIsPrivateSpaceExpanded] = useState(true);
  const [isPrivateSpaceHovered, setIsPrivateSpaceHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);


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

  const startNewChat = () => {
    createNewChat();
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


        </div>

        {/* Menu Options */}
        <div className="p-4">
          <div className="space-y-1">
            <Button
              onClick={startNewChat}
              variant="ghost"
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "New Chat" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">💬</span>
              {isExpanded && <span className="ml-2">New Chat</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "Search" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">🔍</span>
              {isExpanded && <span className="ml-2">Search</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle spaces */}}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "Spaces" : ""}
            >
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-slate-400" />
              {isExpanded && <span className="ml-2">Spaces</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle knowledge base */}}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "Knowledge Base" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">📚</span>
              {isExpanded && <span className="ml-2">Knowledge Base</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle digital personas */}}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "Digital Personas" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">👥</span>
              {isExpanded && <span className="ml-2">Digital Personas</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle tools */}}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "Tools" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">🔧</span>
              {isExpanded && <span className="ml-2">Tools</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle history */}}
              className={`${isExpanded ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 -mx-2 px-4`}
              title={!isExpanded ? "History" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">⏳</span>
              {isExpanded && <span className="ml-2">History</span>}
            </Button>
          </div>
        </div>

        {/* Google Drive Chat History */}
        {isExpanded && (
          <div className="flex-1 overflow-hidden">
            <GoogleDriveChatHistory onSwitchToChat={onSwitchToChat} />
          </div>
        )}

        {/* User Profile Section */}
        {isAuthenticated && (
          <div className="p-4 border-t border-slate-300 dark:border-slate-700">
            <div className={`${isExpanded ? "space-y-3" : "space-y-2"}`}>
              {/* User Info with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`${isExpanded ? "w-full justify-start p-3" : "w-10 h-10 p-0 justify-center"} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                  >
                    <div className={`flex items-center ${isExpanded ? "space-x-3" : "justify-center"}`}>
                      {isExpanded ? (
                        <>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex-shrink-0">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.username || 'User'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <span className="text-lg">👤</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {user?.username || 'User'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Free Plan
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-600 flex-shrink-0" title={user?.username || 'User'}>
                          {user?.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.username || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400">
                              <span className="text-lg">👤</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setShowBilling(true)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">⬆️</span>
                    Upgrade plan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowSettings(true)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">⚙️</span>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open('https://josudo.com/learn', '_blank')}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">📚</span>
                    Learn more
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => (window.location.href = "/api/auth/logout")}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                  >
                    <span className="mr-2">🚪</span>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Sidebar Footer for non-authenticated users */}
        {!isAuthenticated && (
          <div className="p-4 border-t border-slate-300 dark:border-slate-700">
            <div className={`${isExpanded ? "space-y-2" : "space-y-2"}`}>
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                {isExpanded ? "Sign in to save your chats" : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <BillingModal open={showBilling} onClose={() => setShowBilling(false)} />
    </>
  );
};