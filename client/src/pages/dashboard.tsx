import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatArea } from '@/components/Chat/ChatArea';
import { MessageInput } from '@/components/Chat/MessageInput';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import sophiaBackground from '@assets/Sophia background_1752487018233.png';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="h-screen w-full bg-white dark:bg-black">
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

        {/* Subtle overlay for better readability */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>

        {/* Cyberpunk Universe Stars Animation */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Moving Stars Layer 1 */}
          <div className="w-full h-full" style={{
            background: `
              radial-gradient(1px 1px at 5% 10%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(2px 2px at 15% 25%, rgba(255, 0, 255, 0.6), transparent),
              radial-gradient(1px 1px at 25% 40%, rgba(0, 255, 255, 0.7), transparent),
              radial-gradient(1px 1px at 35% 60%, rgba(255, 255, 0, 0.5), transparent),
              radial-gradient(2px 2px at 45% 15%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(1px 1px at 55% 80%, rgba(255, 0, 255, 0.6), transparent),
              radial-gradient(1px 1px at 65% 35%, rgba(0, 255, 255, 0.7), transparent),
              radial-gradient(2px 2px at 75% 55%, rgba(255, 255, 0, 0.5), transparent),
              radial-gradient(1px 1px at 85% 75%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(1px 1px at 95% 20%, rgba(255, 0, 255, 0.6), transparent)
            `,
            backgroundSize: '400px 300px, 300px 400px, 500px 200px, 250px 350px, 350px 250px, 400px 300px, 300px 400px, 500px 200px, 250px 350px, 350px 250px',
            animation: 'starsMove 40s linear infinite, starsGlow 8s ease-in-out infinite'
          }}></div>
          
          {/* Moving Stars Layer 2 */}
          <div className="w-full h-full" style={{
            background: `
              radial-gradient(1px 1px at 10% 30%, rgba(64, 224, 208, 0.6), transparent),
              radial-gradient(1px 1px at 20% 60%, rgba(138, 43, 226, 0.5), transparent),
              radial-gradient(2px 2px at 30% 20%, rgba(30, 144, 255, 0.7), transparent),
              radial-gradient(1px 1px at 40% 70%, rgba(64, 224, 208, 0.4), transparent),
              radial-gradient(1px 1px at 50% 40%, rgba(138, 43, 226, 0.6), transparent),
              radial-gradient(2px 2px at 60% 80%, rgba(30, 144, 255, 0.5), transparent),
              radial-gradient(1px 1px at 70% 50%, rgba(64, 224, 208, 0.7), transparent),
              radial-gradient(1px 1px at 80% 10%, rgba(138, 43, 226, 0.4), transparent),
              radial-gradient(2px 2px at 90% 90%, rgba(30, 144, 255, 0.6), transparent)
            `,
            backgroundSize: '350px 250px, 450px 350px, 300px 200px, 400px 300px, 250px 400px, 350px 250px, 450px 350px, 300px 200px, 400px 300px',
            animation: 'starsMove 60s linear infinite reverse, cyberPulse 12s ease-in-out infinite'
          }}></div>
          
          {/* Cyberpunk Grid Overlay */}
          <div className="w-full h-full" style={{
            background: `
              linear-gradient(90deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%),
              linear-gradient(0deg, transparent 49%, rgba(255, 0, 255, 0.1) 50%, transparent 51%)
            `,
            backgroundSize: '100px 100px, 150px 150px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
          
          {/* Subtle particle effects */}
          <div className="w-full h-full" style={{
            background: `
              radial-gradient(1px 1px at 12% 22%, rgba(64, 224, 208, 0.2), transparent),
              radial-gradient(1px 1px at 32% 42%, rgba(138, 43, 226, 0.15), transparent),
              radial-gradient(1px 1px at 52% 12%, rgba(30, 144, 255, 0.18), transparent),
              radial-gradient(1px 1px at 72% 32%, rgba(64, 224, 208, 0.15), transparent),
              radial-gradient(1px 1px at 92% 52%, rgba(138, 43, 226, 0.2), transparent),
              radial-gradient(1px 1px at 22% 72%, rgba(30, 144, 255, 0.15), transparent),
              radial-gradient(1px 1px at 42% 92%, rgba(64, 224, 208, 0.18), transparent),
              radial-gradient(1px 1px at 82% 82%, rgba(138, 43, 226, 0.15), transparent)
            `,
            backgroundSize: '300px 200px, 400px 300px, 250px 150px, 350px 250px, 300px 200px, 400px 300px, 250px 150px, 350px 250px',
            animation: 'particleFlow 30s linear infinite'
          }}></div>
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
