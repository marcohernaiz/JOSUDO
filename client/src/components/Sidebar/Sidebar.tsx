import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { BillingModal } from '@/components/Modals/BillingModal';
import { ChatHistory } from '@/components/Chat/ChatHistory';
import josudoLogo from '@assets/image_1752482001299.png';
import josudoText from '@assets/JOSUDO_1752482277589.png';

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
      <div className="w-full h-full bg-slate-900 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img 
                  src={josudoLogo} 
                  alt="Josudo Logo" 
                  className="w-10 h-10 object-contain flex-shrink-0"
                  style={{ filter: 'brightness(1.2)' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
                <span className="text-amber-400 text-2xl hidden">⚜️</span>
              </div>
              <img 
                src={josudoText} 
                alt="Josudo" 
                className="h-10 object-contain flex-shrink-0"
                style={{ filter: 'brightness(1.1)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'inline';
                }}
              />
              <span className="font-bold text-white hidden">Josudo</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <Button 
            onClick={createNewChat}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
          >
            <span className="text-white mr-2">+</span>
            New Chat
          </Button>
        </div>

        {/* Active Configuration */}
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="text-xs font-medium text-slate-400 mb-2">ACTIVE CONFIGURATION</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400 text-sm">🤖</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-300">
                Grok (Free)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400 text-sm">💾</span>
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="text-sm text-slate-300">
                No Storage
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-orange-400 text-sm">⚡</span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-300">
                Josudo Processing
              </span>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <ChatHistory onChatSelect={onClose} />
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
            >
              <span className="text-slate-400 mr-1">⚙️</span>Settings
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
