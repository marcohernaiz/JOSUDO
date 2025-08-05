import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/Modals/LoginModal';
import { useState } from 'react';

export default function Auth() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const demoLogin = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/demo-login');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "You're now logged in as a demo user.",
      });
      navigate('/dashboard');
      window.location.reload(); // Refresh to update auth state
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Could not log you in. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardContent className="pt-8 p-8">
          <div className="text-center mb-6">
            <i className="fas fa-robot text-primary text-4xl mb-4"></i>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Josudo</h2>
            <p className="text-slate-600">Your AI assistant platform - start chatting instantly with free AI</p>
          </div>
          
          <Button 
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-3"
            variant="outline"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="font-medium">Sign in</span>
          </Button>

          <div className="text-center text-sm text-slate-500 my-3">
            or
          </div>
          
          <Button 
            onClick={() => demoLogin.mutate()}
            disabled={demoLogin.isPending}
            variant="secondary"
            className="w-full"
          >
            {demoLogin.isPending ? 'Signing in...' : 'Try Demo Account'}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
