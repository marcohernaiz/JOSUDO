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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Connect {getServiceLabel(serviceName)}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-sm font-medium text-slate-900">
              {getServiceType(serviceName) === 'ai_model' ? 'API Key' : 'Access Token'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={getPlaceholder(serviceName)}
              className="mt-2"
            />
            <p className="text-sm text-slate-500 mt-2">
              Your credentials are encrypted and stored securely. We never store your conversations.
            </p>
          </div>

          {showOrganizationId && (
            <div>
              <Label htmlFor="organizationId" className="text-sm font-medium text-slate-900">
                Organization ID (Optional)
              </Label>
              <Input
                id="organizationId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="org-..."
                className="mt-2"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveCredentials"
              checked={saveCredentials}
              onCheckedChange={(checked) => setSaveCredentials(checked as boolean)}
            />
            <Label htmlFor="saveCredentials" className="text-sm text-slate-700">
              Save credentials for future sessions
            </Label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleConnect}
              disabled={createIntegrationMutation.isPending}
              className="flex-1"
            >
              {createIntegrationMutation.isPending ? 'Connecting...' : 'Connect'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
