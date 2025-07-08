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

  if (chatSessions.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <i className="fas fa-comments text-slate-300 text-3xl mb-3"></i>
        <p className="text-sm text-slate-500">No chat history yet</p>
        <p className="text-xs text-slate-400 mt-1">Start a conversation to see your chats here</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="text-xs font-medium text-slate-500 mb-3">CHAT HISTORY</div>
      
      <div className="space-y-2">
        {chatSessions.map((session) => (
          <div 
            key={session.id}
            className="p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
            onClick={() => handleChatSelect(session)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm mb-1 truncate">
                  {session.title}
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  {session.modelUsed} • {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-2 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteChat(e, session.id)}
                  className="p-1 h-6 w-6 text-slate-400 hover:text-red-600"
                >
                  <i className="fas fa-trash text-xs"></i>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
