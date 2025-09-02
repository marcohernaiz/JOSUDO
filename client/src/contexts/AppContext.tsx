import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Integration,
  ChatSession,
  Billing,
  AppContextType,
  Space,
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

  // Query user authentication status
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const refreshIntegrations = async () => {
    // Refresh integrations data
    if (user) {
      await apiRequest("GET", "/api/integrations");
    }
  };

  const refreshChatSessions = async () => {
    // Refresh chat sessions data
    if (user) {
      await apiRequest("GET", "/api/chat-sessions");
    }
  };

  const refreshBilling = async () => {
    // Refresh billing data
    if (user) {
      await apiRequest("GET", "/api/billing");
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
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
