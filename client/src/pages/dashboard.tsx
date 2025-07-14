import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { Button } from '@/components/ui/button';
import { SettingsModal } from '@/components/Modals/SettingsModal';
import { useAppContext } from '@/contexts/AppContext';
import { useState } from 'react';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { setActiveSession } = useAppContext();

  const showSidebar = isMobile ? isSidebarOpen : isHovering;

  const createNewChat = () => {
    setActiveSession(null);
  };

  return (
    <div className="h-screen w-full bg-black">
      <div className="h-full w-full ai-background">
        {/* Compressed Sidebar - Always visible */}
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full w-12 bg-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 z-40 flex flex-col items-center py-4 space-y-3">
            {/* Sidebar indicator/trigger */}
            <div 
              className="w-8 h-8 bg-slate-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-600/60 transition-colors"
              onMouseEnter={() => setIsHovering(true)}
              title="Open sidebar"
            >
              <span className="text-white text-sm">☰</span>
            </div>
            
            {/* Divider */}
            <div className="w-6 h-px bg-slate-600/50"></div>
            
            {/* New chat button */}
            <div 
              className="w-8 h-8 bg-green-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-600/60 transition-colors"
              title="New chat"
              onClick={createNewChat}
            >
              <span className="text-white text-sm">+</span>
            </div>
            
            {/* Active Configuration */}
            <div className="flex flex-col space-y-2 mt-4">
              <div className="text-xs text-slate-400 text-center">ACTIVE</div>
              
              {/* AI Model - Grok */}
              <div 
                className="w-8 h-8 bg-purple-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-600/60 transition-colors"
                title="AI Model: Grok"
              >
                <span className="text-white text-sm">🤖</span>
              </div>
              
              {/* Storage */}
              <div 
                className="w-8 h-8 bg-slate-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-600/60 transition-colors"
                title="Storage: No Storage"
              >
                <span className="text-white text-sm">💾</span>
              </div>
              
              {/* Processing Provider - Josudo */}
              <div 
                className="w-8 h-8 bg-blue-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600/60 transition-colors"
                title="Processing: Josudo"
              >
                <span className="text-white text-sm">⚡</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-6 h-px bg-slate-600/50 mt-4"></div>
            
            {/* Settings button */}
            <div 
              className="w-8 h-8 bg-slate-700/60 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-600/60 transition-colors mt-auto"
              title="Settings"
              onClick={() => setShowSettings(true)}
            >
              <span className="text-white text-sm">⚙️</span>
            </div>
          </div>
        )}

        {/* Hover trigger area - invisible strip on the left for desktop */}
        {!isMobile && (
          <div
            className="fixed left-12 top-0 w-8 h-full z-50 bg-transparent"
            onMouseEnter={() => setIsHovering(true)}
          />
        )}

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-600 text-slate-200 hover:bg-slate-700/80"
            variant="outline"
            size="sm"
          >
            <i className="fas fa-bars"></i>
          </Button>
        )}

        {/* Sidebar */}
        <div 
          className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
            ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'fixed inset-y-0 left-12 z-40'} 
            w-80 transition-transform duration-300 ease-in-out
          `}
          onMouseEnter={() => !isMobile && setIsHovering(true)}
          onMouseLeave={() => !isMobile && setIsHovering(false)}
        >
          <div className="h-full bg-slate-900/90 backdrop-blur-md border-r border-slate-700/50 shadow-xl">
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Desktop Overlay - subtle background when sidebar is open */}
        {!isMobile && showSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-10 z-30" />
        )}

        {/* Dynamic Neural Particles */}
        <div className="neural-particles"></div>

        {/* Main Content */}
        <div className={`flex flex-col h-full relative z-20 ${!isMobile ? 'ml-12' : ''}`}>
          <Header />
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex-1 overflow-hidden">
              <ChatArea />
            </div>
            <div className="flex-shrink-0 flex justify-center pb-20">
              <div className="w-full max-w-3xl px-6">
                <MessageInput />
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        <SettingsModal 
          open={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </div>
    </div>
  );
}
