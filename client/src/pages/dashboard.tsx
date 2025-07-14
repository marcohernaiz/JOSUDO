import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="h-screen w-full bg-black">
      <div className="h-full w-full ai-background flex">
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

        {/* Desktop Sidebar - Always visible */}
        {!isMobile && (
          <div className="fixed inset-y-0 left-0 z-40">
            <div className="h-full bg-slate-900/90 backdrop-blur-md border-r border-slate-700/50 shadow-xl">
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <div 
            className={`
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
              fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
            `}
          >
            <div className="h-full bg-slate-900/90 backdrop-blur-md border-r border-slate-700/50 shadow-xl">
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Dynamic Neural Particles */}
        <div className="neural-particles"></div>

        {/* Main Content - Offset by sidebar width on desktop */}
        <div className={`flex flex-col h-full relative z-20 ${!isMobile ? 'ml-16' : ''}`}>
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
      </div>
    </div>
  );
}
