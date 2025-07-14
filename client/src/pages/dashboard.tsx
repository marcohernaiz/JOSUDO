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

        {/* Subtle overlay for better readability */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>

        {/* Enhanced Visible Animation System */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Large Floating Energy Orbs */}
          <div className="w-full h-full" style={{
            background: `
              radial-gradient(8px 8px at 10% 15%, rgba(0, 255, 255, 0.9), rgba(0, 255, 255, 0.3) 30%, transparent 70%),
              radial-gradient(12px 12px at 25% 35%, rgba(255, 0, 255, 0.8), rgba(255, 0, 255, 0.2) 40%, transparent 70%),
              radial-gradient(10px 10px at 40% 60%, rgba(0, 255, 255, 0.9), rgba(0, 255, 255, 0.3) 35%, transparent 70%),
              radial-gradient(15px 15px at 65% 25%, rgba(255, 255, 0, 0.7), rgba(255, 255, 0, 0.2) 30%, transparent 70%),
              radial-gradient(9px 9px at 80% 45%, rgba(0, 255, 255, 0.8), rgba(0, 255, 255, 0.3) 35%, transparent 70%),
              radial-gradient(11px 11px at 95% 75%, rgba(255, 0, 255, 0.9), rgba(255, 0, 255, 0.3) 30%, transparent 70%)
            `,
            backgroundSize: '300px 200px, 400px 300px, 350px 250px, 500px 350px, 300px 200px, 400px 300px',
            animation: 'floatingOrbs 25s linear infinite, energyPulse 6s ease-in-out infinite'
          }}></div>
          
          {/* Geometric Shapes Layer */}
          <div className="w-full h-full" style={{
            background: `
              conic-gradient(from 0deg at 20% 30%, rgba(0, 255, 255, 0.6) 0deg, transparent 90deg, rgba(0, 255, 255, 0.6) 180deg, transparent 270deg),
              conic-gradient(from 45deg at 50% 20%, rgba(255, 0, 255, 0.5) 0deg, transparent 120deg, rgba(255, 0, 255, 0.5) 240deg, transparent 360deg),
              conic-gradient(from 90deg at 75% 50%, rgba(255, 255, 0, 0.4) 0deg, transparent 90deg, rgba(255, 255, 0, 0.4) 180deg, transparent 270deg),
              conic-gradient(from 180deg at 30% 80%, rgba(0, 255, 255, 0.5) 0deg, transparent 120deg, rgba(0, 255, 255, 0.5) 240deg, transparent 360deg)
            `,
            backgroundSize: '150px 150px, 200px 200px, 180px 180px, 160px 160px',
            animation: 'geometricRotate 20s linear infinite, shapePulse 8s ease-in-out infinite'
          }}></div>
          
          {/* Enhanced Energy Grid */}
          <div className="w-full h-full" style={{
            background: `
              linear-gradient(45deg, transparent 48%, rgba(0, 255, 255, 0.4) 49%, rgba(0, 255, 255, 0.6) 50%, rgba(0, 255, 255, 0.4) 51%, transparent 52%),
              linear-gradient(-45deg, transparent 48%, rgba(255, 0, 255, 0.3) 49%, rgba(255, 0, 255, 0.5) 50%, rgba(255, 0, 255, 0.3) 51%, transparent 52%)
            `,
            backgroundSize: '80px 80px, 120px 120px',
            animation: 'energyGrid 15s linear infinite'
          }}></div>
          
          {/* Bright Particle System */}
          <div className="w-full h-full" style={{
            background: `
              radial-gradient(4px 4px at 15% 25%, rgba(64, 224, 208, 0.9), rgba(64, 224, 208, 0.4) 50%, transparent 70%),
              radial-gradient(6px 6px at 35% 45%, rgba(138, 43, 226, 0.8), rgba(138, 43, 226, 0.3) 50%, transparent 70%),
              radial-gradient(5px 5px at 55% 15%, rgba(30, 144, 255, 0.9), rgba(30, 144, 255, 0.4) 50%, transparent 70%),
              radial-gradient(4px 4px at 75% 65%, rgba(64, 224, 208, 0.8), rgba(64, 224, 208, 0.3) 50%, transparent 70%),
              radial-gradient(7px 7px at 85% 35%, rgba(138, 43, 226, 0.9), rgba(138, 43, 226, 0.4) 50%, transparent 70%),
              radial-gradient(5px 5px at 25% 85%, rgba(30, 144, 255, 0.8), rgba(30, 144, 255, 0.3) 50%, transparent 70%)
            `,
            backgroundSize: '200px 200px, 300px 300px, 250px 250px, 200px 200px, 300px 300px, 250px 250px',
            animation: 'brightParticles 35s linear infinite'
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
