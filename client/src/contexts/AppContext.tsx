import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Integration, ChatSession, Billing, AppContextType } from '../types';
import { apiRequest } from '@/lib/queryClient';

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  // Add chat messages state
  const [messages, setMessages] = useState<import('../types').ChatMessage[]>([]);

  // No authentication required - provide default values
  const integrations: Integration[] = [];
  const chatSessions: ChatSession[] = [];
  const billing: Billing | null = null;

  const refreshIntegrations = async () => {
    // No-op since we don't have user-specific data
  };

  const refreshChatSessions = async () => {
    // No-op since we don't have user-specific data
  };

  const refreshBilling = async () => {
    // No-op since we don't have user-specific data
  };

  const contextValue: AppContextType = {
    user: null,
    isAuthenticated: false,
    integrations,
    chatSessions,
    activeSession,
    billing,
    isLoading: false,
    setActiveSession,
    refreshIntegrations,
    refreshChatSessions,
    refreshBilling,
    // Add these for chat state
    messages,
    setMessages,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
