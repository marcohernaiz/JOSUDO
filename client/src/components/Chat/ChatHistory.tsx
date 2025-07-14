import { useAppContext } from '@/contexts/AppContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryProps {
  onChatSelect?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ onChatSelect }) => {
  const { chatSessions, setActiveSession } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteChatMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('DELETE', `/api/chat/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      toast({
        title: 'Chat Deleted',
        description: 'Chat session has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete chat session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleChatSelect = (session: any) => {
    setActiveSession(session);
    onChatSelect?.();
  };

  const handleDeleteChat = (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    deleteChatMutation.mutate(sessionId);
  };

  // Always show empty state since no user accounts
  return (
    <div className="px-4 py-8 text-center">
      <i className="fas fa-comments text-slate-600 text-3xl mb-3"></i>
      <p className="text-sm text-slate-400">Chat history disabled</p>
      <p className="text-xs text-slate-500 mt-1">Start a new conversation above</p>
    </div>
  );
};
