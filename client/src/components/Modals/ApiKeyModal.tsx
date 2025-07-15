import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  serviceName: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ open, onClose, serviceName }) => {
  const { refreshIntegrations } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(true);
  const { toast } = useToast();

  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/integrations', data);
      return response.json();
    },
    onSuccess: () => {
      refreshIntegrations();
      toast({
        title: 'Integration Connected',
        description: `${getServiceLabel(serviceName)} has been connected successfully.`,
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect the service. Please check your credentials.',
        variant: 'destructive',
      });
    },
  });

  const handleConnect = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Missing API Key',
        description: 'Please enter your API key.',
        variant: 'destructive',
      });
      return;
    }

    const credentials = {
      apiKey: apiKey.trim(),
      ...(organizationId && { organizationId: organizationId.trim() }),
    };

    createIntegrationMutation.mutate({
      serviceType: getServiceType(serviceName),
      serviceName,
      credentialsEncrypted: JSON.stringify(credentials),
      isActive: true,
    });
  };

  const resetForm = () => {
    setApiKey('');
    setOrganizationId('');
    setSaveCredentials(true);
  };

  const getServiceLabel = (name: string) => {
    const labels = {
      'openai': 'OpenAI',
      'claude': 'Anthropic Claude',
      'gemini': 'Google Gemini',
      'google_drive': 'Google Drive',
      'dropbox': 'Dropbox',
    };
    return labels[name] || name;
  };

  const getServiceType = (name: string) => {
    const storageServices = ['google_drive', 'dropbox'];
    return storageServices.includes(name) ? 'storage' : 'ai_model';
  };

  const getPlaceholder = (name: string) => {
    const placeholders = {
      'openai': 'sk-...',
      'claude': 'sk-ant-...',
      'gemini': 'AI...',
      'google_drive': 'OAuth Token',
      'dropbox': 'OAuth Token',
    };
    return placeholders[name] || 'API Key';
  };

  const showOrganizationId = serviceName === 'openai';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-slate-900 dark:text-white">
            <span className="text-lg font-semibold">Connect {getServiceLabel(serviceName)}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-800">
              <i className="fas fa-times text-slate-600 dark:text-slate-400"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="apiKey" className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
              {getServiceType(serviceName) === 'ai_model' ? 'API Key' : 'Access Token'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={getPlaceholder(serviceName)}
              className="mt-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
              <i className="fas fa-shield-alt mr-2 text-green-600 dark:text-green-400"></i>
              Your credentials are encrypted and stored securely. We never store your conversations.
            </p>
          </div>

          {showOrganizationId && (
            <div>
              <Label htmlFor="organizationId" className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                Organization ID (Optional)
              </Label>
              <Input
                id="organizationId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="org-..."
                className="mt-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Checkbox
              id="saveCredentials"
              checked={saveCredentials}
              onCheckedChange={(checked) => setSaveCredentials(checked as boolean)}
              className="border-slate-400 dark:border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="saveCredentials" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
              Save credentials for future sessions
            </Label>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={handleConnect}
              disabled={createIntegrationMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium"
            >
              {createIntegrationMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
