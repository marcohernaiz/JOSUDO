import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { LoginModal } from "@/components/Modals/LoginModal";
import { useState } from "react";

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className="px-3 relative z-10">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <Button 
              onClick={handleLoginClick}
              className="bg-[#d7dce4] dark:bg-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-white border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="font-medium">Sign in</span>
            </Button>
          )}
          {isAuthenticated && (
            <span className="text-white dark:text-white text-sm">Welcome, {user?.username}</span>
          )}
          <Button
            onClick={toggleTheme}
            className="p-2 bg-[#626567] dark:bg-black hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-none"
            variant="ghost"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </Button>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
};
