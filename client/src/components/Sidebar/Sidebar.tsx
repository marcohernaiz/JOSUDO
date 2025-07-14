import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { BillingModal } from '@/components/Modals/BillingModal';
import { ChatHistory } from '@/components/Chat/ChatHistory';
import josudoLogo from '@assets/image_1752482001299.png';
import josudoText from '@assets/image_1752482551893.png';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { setActiveSession } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const createNewChat = () => {
    setActiveSession(null);
    onClose?.();
  };

  return (
    <>
      <div 
        className={`h-full bg-slate-100 dark:bg-slate-900/80 border-r border-slate-300 dark:border-slate-700 flex flex-col transition-all duration-75 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-300 dark:border-slate-700">
          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} mb-4`}>
            <div className={`flex items-center ${isExpanded ? 'space-x-3' : 'justify-center'}`}>
              <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
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
              {isExpanded && (
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
              )}
              <span className="font-bold text-black dark:text-white hidden">Josudo</span>
            </div>
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
          </div>
          
          <div className={`${isExpanded ? '' : 'flex justify-center'}`}>
            <Button 
              onClick={createNewChat}
              className={`${isExpanded ? 'w-full' : 'w-10 h-10 p-0'} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 flex items-center justify-center`}
              title={!isExpanded ? "New Chat" : ""}
            >
              <span className="text-white text-lg">+</span>
              {isExpanded && <span className="ml-2">New Chat</span>}
            </Button>
          </div>
        </div>

        {/* Active Configuration */}
        <div className="px-4 py-3 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
          {isExpanded && (
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">ACTIVE CONFIGURATION</div>
          )}
          <div className="space-y-2">
            <div className={`flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'}`}>
              <span className="text-blue-400 text-2xl flex-shrink-0">🤖</span>
              {isExpanded && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Grok (Free)
                  </span>
                </>
              )}
            </div>
            <div className={`flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'}`}>
              <span className="text-purple-400 text-2xl flex-shrink-0">💾</span>
              {isExpanded && (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    No Storage
                  </span>
                </>
              )}
            </div>
            <div className={`flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'}`}>
              <span className="text-orange-400 text-2xl flex-shrink-0">⚡</span>
              {isExpanded && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Josudo Processing
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat History */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto">
            <ChatHistory onChatSelect={onClose} />
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-300 dark:border-slate-700">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(true)}
              className={`${isExpanded ? 'flex-1 justify-start' : 'w-10 h-10 p-0 justify-center'} text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center`}
              title={!isExpanded ? "Settings" : ""}
            >
              <span className="text-slate-400 text-2xl">⚙️</span>
              {isExpanded && <span className="ml-2">Settings</span>}
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
