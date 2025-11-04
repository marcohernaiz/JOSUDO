import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User,
  Integration,
  ChatSession,
  Billing,
  AppContextType,
  Space,
  DigitalPersona,
} from "../types";
import { apiRequest } from "@/lib/queryClient";

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [location] = useLocation();
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  // Add chat messages state
  const [messages, setMessages] = useState<import("../types").ChatMessage[]>(
    [],
  );
  // Add current session ID for Google Drive
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  // Add AI model selection state
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-v3");
  // Add active section state
  const [activeSection, setActiveSection] = useState<string>("chat");
  // Add spaces state
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  // Add digital personas state
  const [selectedPersona, setSelectedPersona] = useState<import("../types").SelectedPersona | null>(null);
  // Add settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsModalConfig, setSettingsModalConfig] = useState<{
    activeTab?: string;
    expandedSections?: Record<string, boolean>;
  } | null>(null);

  // Skip user authentication for admin routes
  const isAdminRoute = location.startsWith('/admin/');

  // Query user authentication status (skip for admin routes)
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isAdminRoute, // Don't fetch user data for admin pages
  });

  // Only fetch user-specific data if authenticated
  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: chatSessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat-sessions"],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: billing = null } = useQuery<Billing>({
    queryKey: ["/api/billing"],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const queryClient = useQueryClient();
  
  const refreshIntegrations = async () => {
    // Refresh integrations data by invalidating the query cache
    if (user) {
      await queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    }
  };

  const refreshChatSessions = async () => {
    // Refresh chat sessions data by invalidating the query cache
    if (user) {
      await queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
    }
  };

  const refreshBilling = async () => {
    // Refresh billing data by invalidating the query cache
    if (user) {
      await queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
    }
  };

  const logout = () => {
    // Clear local state
    setActiveSession(null);
    setMessages([]);
    setCurrentSessionId(null);

    // Redirect to logout endpoint
    window.location.href = "/api/auth/logout";
  };

  // Function to open settings modal with specific configuration
  const openSettingsModal = (config?: {
    activeTab?: string;
    expandedSections?: Record<string, boolean>;
  }) => {
    setSettingsModalConfig(config || null);
    setShowSettingsModal(true);
  };

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
    setSettingsModalConfig(null);
  };

  const contextValue: AppContextType = {
    user: user || null,
    isAuthenticated: !!user,
    integrations,
    chatSessions,
    activeSession,
    billing,
    isLoading: isUserLoading,
    setActiveSession,
    refreshIntegrations,
    refreshChatSessions,
    refreshBilling,
    messages,
    setMessages,
    currentSessionId,
    setCurrentSessionId,
    selectedModel,
    setSelectedModel,
    activeSection,
    setActiveSection,
    spaces,
    currentSpace,
    setCurrentSpace,
    selectedPersona,
    setSelectedPersona,
    showSettingsModal,
    settingsModalConfig,
    openSettingsModal,
    closeSettingsModal,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
