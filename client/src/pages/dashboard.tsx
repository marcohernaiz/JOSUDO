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
    <div className="flex h-screen overflow-hidden ai-background">
      {/* Hover trigger area - invisible strip on the left for desktop */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 w-4 h-full z-50 bg-transparent"
          onMouseEnter={() => setIsHovering(true)}
        />
      )}

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col ai-chat-container">
          <ChatArea />
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
