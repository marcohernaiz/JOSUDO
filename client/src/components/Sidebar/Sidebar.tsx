import { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/Modals/SettingsModal";
import { BillingModal } from "@/components/Modals/BillingModal";
import { GoogleDriveChatHistory } from "@/components/Sidebar/GoogleDriveChatHistory";
import { PaymentModal } from "@/components/Modals/PaymentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import josudoLogoOrange from "@assets/JOSUDO logo - naranja con Own Your data_1756038073769.png";
import josudoIcon from "@assets/JOSUDO logo icon_1752491258890.png";
import folderIcon from "@assets/vecteezy_simple-folder-icon-on-white-background_4693395-1_1755935645704.jpg";
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
  History,
  Box
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  onSwitchToChat?: () => void;
  onSectionChange?: (section: 'chat' | 'digital-personas' | 'knowledge-base' | 'spaces' | 'tools') => void;
  onSpaceSelect?: (spaceId: number) => void;
  activeSection?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, onSwitchToChat, onSectionChange, onSpaceSelect, activeSection }) => {
  const { setActiveSession, setMessages, setCurrentSessionId, user } =
    useAppContext();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(window.innerWidth >= 1200);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isPrivateSpaceExpanded, setIsPrivateSpaceExpanded] = useState(true);
  const [isPrivateSpaceHovered, setIsPrivateSpaceHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);

  // Fetch user credits
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserCredits();
    }
  }, [isAuthenticated, user]);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div className="px-2 py-0 border-b border-slate-300 dark:border-slate-700">
          <div
            className={`flex items-center ${isExpanded ? "justify-between" : "flex-col"}`}
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
                  <img
                    src={josudoIcon}
                    alt="JOSUDO"
                    className="w-6 h-6 object-contain flex-shrink-0"
                    style={{ filter: 'brightness(0) saturate(100%) invert(0%)' }}
                  />
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
                <div className="flex items-center w-full">
                  <img
                    src={josudoLogoOrange}
                    alt="JOSUDO - Own Your Data"
                    className="h-24 w-auto object-contain mx-auto"
                  />
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
        <div className="px-2 py-0">
          <div className="space-y-1">
            <Button
              onClick={() => { startNewChat(); onSectionChange?.('chat'); }}
              variant="ghost"
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 ${
                activeSection === 'chat' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
              title={!isExpanded ? "New Chat" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">💬</span>
              {isExpanded && <span className="ml-2">New Chat</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowSearch(!showSearch)}
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200`}
              title={!isExpanded ? "Search" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">🔍</span>
              {isExpanded && <span className="ml-2">Search</span>}
            </Button>

            <div>
              <Button
                variant="ghost"
                onClick={() => onSectionChange?.('spaces')}
                className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 ${
                  activeSection === 'spaces' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                }`}
                title={!isExpanded ? "Spaces" : ""}
              >
                <Box className="w-4 h-4 flex-shrink-0 text-slate-400" />
                {isExpanded && <span className="ml-2">Spaces</span>}
              </Button>
              
              {/* Expandable Spaces List */}
              {isExpanded && activeSection === 'spaces' && (
                <div className="ml-6 mt-2 space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => { onSectionChange?.('spaces'); onSpaceSelect?.(1); }}
                    className="w-full justify-start px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  >
                    <span className="text-slate-400 text-sm mr-2">👤</span>
                    My Personal Space
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { onSectionChange?.('spaces'); onSpaceSelect?.(2); }}
                    className="w-full justify-start px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  >
                    <span className="text-slate-400 text-sm mr-2">💼</span>
                    My Workspace
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => onSectionChange?.('knowledge-base')}
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 ${
                activeSection === 'knowledge-base' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
              title={!isExpanded ? "Knowledge Base" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">📚</span>
              {isExpanded && <span className="ml-2">Knowledge Base</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => onSectionChange?.('digital-personas')}
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 ${
                activeSection === 'digital-personas' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
              title={!isExpanded ? "Digital Personas" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">👥</span>
              {isExpanded && <span className="ml-2">Digital Personas</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => onSectionChange?.('tools')}
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200 ${
                activeSection === 'tools' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
              title={!isExpanded ? "Tools" : ""}
            >
              <span className="text-slate-400 text-lg flex-shrink-0">🔧</span>
              {isExpanded && <span className="ml-2">Tools</span>}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {/* Handle history */}}
              className={`${isExpanded ? "w-full justify-start px-4" : "w-12 h-12 mx-auto p-0 justify-center"} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center rounded-md transition-colors duration-200`}
              title={!isExpanded ? "History" : ""}
            >
              <History className="text-slate-400 w-4 h-4 flex-shrink-0" />
              {isExpanded && <span className="ml-2">History</span>}
            </Button>
          </div>
        </div>

        {/* Google Drive Chat History - Takes remaining space */}
        <div className="flex-1 overflow-hidden min-h-0">
          {isExpanded && <GoogleDriveChatHistory onSwitchToChat={() => { onSwitchToChat?.(); onSectionChange?.('chat'); }} />}
        </div>

        {/* User Profile Section - Fixed at bottom */}
        {isAuthenticated && (
          <div className={`${isExpanded ? "p-4" : "p-2"} border-t border-slate-300 dark:border-slate-700`}>
            <div className={`${isExpanded ? "space-y-3" : "space-y-2"}`}>
              {/* User Info with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`${isExpanded ? "w-full justify-start p-3" : "w-10 h-10 p-0 justify-center"} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                    title={!isExpanded ? (user?.username || 'User Profile') : ""}
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
                              {userCredits} credits available
                            </div>
                          </div>
                        </>
                      ) : (
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

        {/* Sidebar Footer for non-authenticated users - Fixed at bottom */}
        {!isAuthenticated && (
          <div className={`${isExpanded ? "p-4" : "p-2"} border-t border-slate-300 dark:border-slate-700`}>
            <div className={`${isExpanded ? "space-y-2" : ""}`}>
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3">
                {isExpanded ? "Sign in to save your chats" : ""}
              </div>
              {isExpanded ? (
                <button 
                  className="gsi-material-button w-full" 
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{display: 'block'}} className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.17 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">Sign in with Google</span>
                    <span style={{display: 'none'}}>Sign in with Google</span>
                  </div>
                </button>
              ) : (
                <div className="flex justify-center">
                  <button
                    className="w-8 h-8 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center rounded-md transition-colors"
                    onClick={() => window.location.href = '/api/auth/google'}
                    title="Sign in with Google"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="w-4 h-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.17 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <PaymentModal 
        open={showBilling} 
        onClose={() => {
          setShowBilling(false);
          // Refresh credits after payment
          if (isAuthenticated && user) {
            fetchUserCredits();
          }
        }} 
      />
    </>
  );
};