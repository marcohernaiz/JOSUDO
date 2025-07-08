import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Auth() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [, navigate] = useLocation();

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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to AI Assistant Platform</h2>
            <p className="text-slate-600">Connect your AI accounts and storage to get started</p>
          </div>
          
          <Button 
            onClick={login}
            className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-3"
            variant="outline"
          >
            <i className="fab fa-google text-red-500"></i>
            <span className="font-medium">Continue with Google</span>
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500">By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
