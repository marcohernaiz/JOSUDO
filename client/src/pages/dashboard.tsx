import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import sophiaBackground from '@assets/Sophia background_1752487018233.png';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="h-screen w-full bg-white dark:bg-black">
      <ThemeToggle />
      <div 
        className="h-full w-full flex relative"
        style={{
          backgroundImage: `url(${sophiaBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Theme overlay */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/5"></div>
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-2 left-2 z-50 bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-600 text-slate-200 hover:bg-slate-700/80"
            variant="outline"
            size="sm"
          >
            <i className="fas fa-bars"></i>
          </Button>
        )}

        {/* Desktop Sidebar - Always visible */}
        {!isMobile && (
          <div className="fixed inset-y-0 left-0 z-40">
            <div className="h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-300/50 dark:border-slate-700/50 shadow-xl">
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
            <div className="h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-300/50 dark:border-slate-700/50 shadow-xl">
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

        {/* Starfield Animation */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="starfield"></div>
          <div className="starfield-2"></div>
        </div>

        {/* Main Content - Offset by sidebar width on desktop */}
        <div className={`flex flex-col h-full relative z-30 ${!isMobile ? 'ml-16' : ''} w-full`}>
          <div className="absolute top-0 left-0 w-full z-40">
            <Header />
          </div>
          <div className="flex-1 flex flex-col justify-end items-center pt-32">
            <div className="flex-1 overflow-hidden w-full">
              <ChatArea />
            </div>
            <div className="flex-shrink-0 pb-20 w-full flex justify-center">
              <MessageInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
