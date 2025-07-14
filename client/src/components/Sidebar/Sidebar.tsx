import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { BillingModal } from '@/components/Modals/BillingModal';
import { ChatHistory } from '@/components/Chat/ChatHistory';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { setActiveSession } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  const createNewChat = () => {
    setActiveSession(null);
    onClose?.();
  };

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
            <span className="mr-2">+</span>
            New Chat
          </Button>
        </div>

        {/* Active Configuration */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-xs font-medium text-slate-500 mb-2">ACTIVE CONFIGURATION</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🤖</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-700">
                Grok (Active)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">💾</span>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-sm text-slate-700">
                No storage connected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">⚡</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-700">
                Josudo (Processing)
              </span>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <ChatHistory onChatSelect={onClose} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <span className="mr-1">⚙️</span>Settings
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
