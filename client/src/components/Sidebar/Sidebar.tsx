import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { BillingModal } from '@/components/Modals/BillingModal';
import { ChatHistory } from '@/components/Chat/ChatHistory';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { billing, integrations, setActiveSession } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  const createNewChat = () => {
    setActiveSession(null);
    onClose?.();
  };

  const activeAIModel = integrations.find(i => i.serviceType === 'ai_model' && i.isActive);
  const activeStorage = integrations.find(i => i.serviceType === 'storage' && i.isActive);

  const balanceValue = billing ? parseFloat(billing.monthlyBalance) : 0;
  const balancePercentage = (balanceValue / 9.99) * 100;

  return (
    <>
      <div className="w-full h-full bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <i className="fas fa-robot text-primary text-xl"></i>
              <span className="font-bold text-slate-900">Josudo</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <Button 
            onClick={createNewChat}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            <i className="fas fa-plus mr-2"></i>
            New Chat
          </Button>
        </div>

        {/* Active Configuration */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-2">ACTIVE CONFIGURATION</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${activeAIModel ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              <span className="text-sm text-slate-700">
                {activeAIModel?.serviceName || 'No AI model connected'}
              </span>
              <i 
                className="fas fa-cog text-slate-400 text-xs cursor-pointer hover:text-slate-600"
                onClick={() => setShowSettings(true)}
              ></i>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${activeStorage ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
              <span className="text-sm text-slate-700">
                {activeStorage?.serviceName || 'No storage connected'}
              </span>
              <i 
                className="fas fa-cog text-slate-400 text-xs cursor-pointer hover:text-slate-600"
                onClick={() => setShowSettings(true)}
              ></i>
            </div>
          </div>
        </div>

        {/* Account Balance */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Monthly Balance</span>
              <span className="text-lg font-bold text-emerald-600">
                ${balanceValue.toFixed(2)}
              </span>
            </div>
            <Progress value={balancePercentage} className="h-2 mb-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">$9.99 monthly</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBilling(true)}
                className="text-xs text-primary hover:text-primary/80"
              >
                Top Up
              </Button>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <ChatHistory onChatSelect={onClose} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar} alt={user?.username} />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 text-sm truncate">{user?.username}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-cog mr-1"></i>Settings
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="flex-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-sign-out-alt mr-1"></i>Sign Out
            </Button>
          </div>
        </div>
      </div>

      <SettingsModal 
        open={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      <BillingModal 
        open={showBilling} 
        onClose={() => setShowBilling(false)} 
      />
    </>
  );
};
