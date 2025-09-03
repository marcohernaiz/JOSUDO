import React from 'react';

export interface User {
  id: number;
  googleId?: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  subscriptionStatus: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface ChatSession {
  id: number;
  userId: number;
  title: string;
  modelUsed: string;
  storageLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: string;
  model?: string;
}

export interface Integration {
  id: number;
  userId: number;
  serviceType: "ai_model" | "storage";
  serviceName: string;
  credentialsEncrypted: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Billing {
  id: number;
  userId: number;
  monthlyBalance: string;
  lastBillingDate: Date;
  overageAmount: string;
}

export interface UsageLog {
  id: number;
  userId: number;
  chatSessionId?: number;
  modelUsed: string;
  tokensConsumed: number;
  cost: string;
  timestamp: Date;
  isPremiumAccount: boolean;
}

// Import spaces-related types from shared schema
export interface Space {
  id: number;
  userId: number;
  name: string;
  description?: string;
  coverImage?: string;
  iconType: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: number;
  spaceId: number;
  title: string;
  type: string;
  content?: string;
  fileUrl?: string;
  metadata?: any;
  isInKnowledgeBase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: number;
  spaceId: number;
  title: string;
  content: string;
  isInKnowledgeBase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  spaceId: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedToEmployeeId?: number;
  createdByTool?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tool {
  id: number;
  spaceId: number;
  name: string;
  description?: string;
  type: string;
  configuration?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualEmployee {
  id: number;
  spaceId: number;
  name: string;
  role: string;
  avatar?: string;
  assignedTools?: string[];
  configuration?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  integrations: Integration[];
  chatSessions: ChatSession[];
  activeSession: ChatSession | null;
  billing: Billing | null;
  isLoading: boolean;
  setActiveSession: (session: ChatSession | null) => void;
  refreshIntegrations: () => Promise<void>;
  refreshChatSessions: () => Promise<void>;
  refreshBilling: () => Promise<void>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  // Add active section state
  activeSection: string;
  setActiveSection: (section: string) => void;
  // Add spaces state
  spaces: Space[];
  currentSpace: Space | null;
  setCurrentSpace: (space: Space | null) => void;
}
