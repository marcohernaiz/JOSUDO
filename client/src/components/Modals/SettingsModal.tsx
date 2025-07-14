import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ApiKeyModal } from './ApiKeyModal';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { integrations, refreshIntegrations } = useAppContext();
  const [activeTab, setActiveTab] = useState('integrations');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      await apiRequest('DELETE', `/api/integrations/${integrationId}`);
    },
    onSuccess: () => {
      refreshIntegrations();
      toast({
        title: 'Integration Removed',
        description: 'Integration has been removed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Remove Failed',
        description: 'Failed to remove integration. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleConnect = (serviceName: string) => {
    setSelectedService(serviceName);
    setShowApiKeyModal(true);
  };

  const handleDisconnect = (integrationId: number) => {
    deleteIntegrationMutation.mutate(integrationId);
  };

  const getIntegrationStatus = (serviceName: string) => {
    return integrations.find(i => i.serviceName === serviceName && i.isActive);
  };

  const aiModels = [
    { name: 'openai', label: 'OpenAI GPT-4', icon: 'fas fa-brain', color: 'text-green-500' },
    { name: 'claude', label: 'Anthropic Claude', icon: 'fas fa-robot', color: 'text-slate-400' },
    { name: 'gemini', label: 'Google Gemini', icon: 'fas fa-star', color: 'text-slate-400' },
  ];

  const storageServices = [
    { name: 'google_drive', label: 'Google Drive', icon: 'fab fa-google-drive', color: 'text-blue-500' },
    { name: 'dropbox', label: 'Dropbox', icon: 'fab fa-dropbox', color: 'text-slate-400' },
  ];

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: 'fas fa-plug' },
    { id: 'billing', label: 'Billing', icon: 'fas fa-credit-card' },
    { id: 'usage', label: 'Usage', icon: 'fas fa-chart-line' },
    { id: 'api', label: 'API Keys', icon: 'fas fa-key' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0 bg-slate-900">
          <div className="flex">
            {/* Settings Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 p-6">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-white">Settings</DialogTitle>
              </DialogHeader>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-900">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <i className="fas fa-times"></i>
                </Button>
              </div>

              {activeTab === 'integrations' && (
                <div className="space-y-8">
                  {/* AI Models Section */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-4">AI Models</h4>
                    <div className="space-y-3">
                      {aiModels.map((model) => {
                        const integration = getIntegrationStatus(model.name);
                        return (
                          <div 
                            key={model.name}
                            className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <i className={`${model.icon} ${integration ? 'text-green-500' : model.color}`}></i>
                              <div>
                                <div className="font-medium text-white">{model.label}</div>
                                <div className="text-sm text-slate-400">
                                  {integration ? 'Connected with your API key' : 'Not connected'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {integration ? (
                                <>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Connected
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDisconnect(integration.id)}
                                  >
                                    <i className="fas fa-unlink"></i>
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleConnect(model.name)}
                                >
                                  Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Storage Section */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-4">Cloud Storage</h4>
                    <div className="space-y-3">
                      {storageServices.map((service) => {
                        const integration = getIntegrationStatus(service.name);
                        return (
                          <div 
                            key={service.name}
                            className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <i className={`${service.icon} ${integration ? 'text-blue-500' : service.color}`}></i>
                              <div>
                                <div className="font-medium text-white">{service.label}</div>
                                <div className="text-sm text-slate-400">
                                  {integration ? 'Connected and syncing' : 'Not connected'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {integration ? (
                                <>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Connected
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDisconnect(integration.id)}
                                  >
                                    <i className="fas fa-unlink"></i>
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleConnect(service.name)}
                                >
                                  Connect
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="text-center py-8">
                  <i className="fas fa-credit-card text-slate-500 text-4xl mb-4"></i>
                  <p className="text-slate-400">Billing settings will be implemented here</p>
                </div>
              )}

              {activeTab === 'usage' && (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-slate-500 text-4xl mb-4"></i>
                  <p className="text-slate-400">Usage analytics will be implemented here</p>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="text-center py-8">
                  <i className="fas fa-key text-slate-500 text-4xl mb-4"></i>
                  <p className="text-slate-400">API key management will be implemented here</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ApiKeyModal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        serviceName={selectedService}
      />
    </>
  );
};
