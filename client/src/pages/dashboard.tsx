import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const showSidebar = isMobile ? isSidebarOpen : isHovering;

  return (
    <div className="h-screen w-full ai-background">
      {/* Hover trigger area - invisible strip on the left for desktop */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 w-8 h-full z-50 bg-transparent"
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
          ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'fixed inset-y-0 left-0 z-40'} 
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
      <div className="flex flex-col h-full relative z-20">
        <Header />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-700/30 rounded-xl m-4 p-4">
            <ChatArea />
          </div>
          <div className="flex-shrink-0">
            <MessageInput />
          </div>
        </div>
      </div>
    </div>
  );
}
