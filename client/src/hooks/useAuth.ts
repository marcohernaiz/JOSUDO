import { useAppContext } from '@/contexts/AppContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAppContext();
  const { toast } = useToast();

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/';
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'There was an error signing out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
  };
};
