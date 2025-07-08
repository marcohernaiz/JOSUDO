import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

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
            onClick={login}
            className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-3"
            variant="outline"
          >
            <i className="fab fa-google text-red-500"></i>
            <span className="font-medium">Continue with Google</span>
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
    </div>
  );
}
