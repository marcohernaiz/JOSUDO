import { useAuth } from "@/hooks/useAuth";
import josudoLogo from "@assets/josudo light background_1756031061697.webp";

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="p-2 relative z-10">
      <div className="flex items-center justify-between">
        {/* Left spacer for balance */}
        <div className="flex-1"></div>
        
        {/* Empty center space */}
        <div className="flex-1 flex justify-center">
        </div>
        
        {/* Right side - Empty for now */}
        <div className="flex-1 flex justify-end">
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <span className="text-gray-900 dark:text-white text-sm">Welcome, {user?.username}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
