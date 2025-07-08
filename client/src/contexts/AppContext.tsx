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

  const { data: user, isLoading: userLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const { data: integrations = [], refetch: refetchIntegrations } = useQuery<Integration[]>({
    queryKey: ['/api/integrations'],
    enabled: !!user,
  });

  const { data: chatSessions = [], refetch: refetchChatSessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: !!user,
  });

  const { data: billingData, refetch: refetchBilling } = useQuery<{ billing: Billing }>({
    queryKey: ['/api/billing'],
    enabled: !!user,
  });

  const refreshIntegrations = async () => {
    await refetchIntegrations();
  };

  const refreshChatSessions = async () => {
    await refetchChatSessions();
  };

  const refreshBilling = async () => {
    await refetchBilling();
  };

  const contextValue: AppContextType = {
    user: user || null,
    isAuthenticated: !!user,
    integrations,
    chatSessions,
    activeSession,
    billing: billingData?.billing || null,
    isLoading: userLoading,
    setActiveSession,
    refreshIntegrations,
    refreshChatSessions,
    refreshBilling,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
