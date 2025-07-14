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
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: string;
  model?: string;
}

export interface Integration {
  id: number;
  userId: number;
  serviceType: 'ai_model' | 'storage';
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
  // Add these for chat state
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}
