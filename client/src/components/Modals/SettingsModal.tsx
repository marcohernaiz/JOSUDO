import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ApiKeyModal } from './ApiKeyModal';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { integrations, refreshIntegrations } = useAppContext();
  const [activeTab, setActiveTab] = useState('integrations');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    aiModels: false,
    cloudStorage: false,
    processing: false,
    mcpServers: false
  });
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

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const renderIntegrationSection = (
    sectionKey: string,
    title: string,
    items: any[],
    icon: string
  ) => {
    const isExpanded = expandedSections[sectionKey];
    return (
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <i className={`${icon} text-cyan-400`}></i>
            <h4 className="text-sm font-medium text-white">{title}</h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 bg-slate-900 space-y-3">
            {items.map((item) => {
              const integration = getIntegrationStatus(item.name);
              return (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${item.icon} ${integration ? 'text-green-500' : item.color}`}></i>
                    <div>
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-sm text-white">
                        {integration ? 'Connected and active' : 'Not connected'}
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
                        onClick={() => handleConnect(item.name)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const aiModels = [
    { name: 'openai', label: 'OpenAI GPT-4', icon: 'fas fa-brain', color: 'text-green-400' },
    { name: 'claude', label: 'Anthropic Claude', icon: 'fas fa-robot', color: 'text-purple-400' },
    { name: 'gemini', label: 'Google Gemini', icon: 'fas fa-star', color: 'text-blue-400' },
    { name: 'grok', label: 'xAI Grok', icon: 'fas fa-lightning', color: 'text-yellow-400' },
    { name: 'llama', label: 'Meta Llama', icon: 'fas fa-fire', color: 'text-red-400' },
  ];

  const storageServices = [
    { name: 'google_drive', label: 'Google Drive', icon: 'fab fa-google-drive', color: 'text-blue-400' },
    { name: 'dropbox', label: 'Dropbox', icon: 'fab fa-dropbox', color: 'text-cyan-400' },
    { name: 'icloud', label: 'Apple iCloud', icon: 'fab fa-apple', color: 'text-slate-300' },
    { name: 'onedrive', label: 'Microsoft OneDrive', icon: 'fab fa-microsoft', color: 'text-indigo-400' },
  ];

  const processingProviders = [
    { name: 'aws', label: 'Amazon Web Services', icon: 'fab fa-aws', color: 'text-orange-400' },
    { name: 'google_cloud', label: 'Google Cloud Platform', icon: 'fab fa-google', color: 'text-blue-400' },
    { name: 'azure', label: 'Microsoft Azure', icon: 'fab fa-microsoft', color: 'text-cyan-400' },
    { name: 'josudo', label: 'Josudo Processing', icon: 'fas fa-bolt', color: 'text-orange-400' },
  ];

  const mcpServers = [
    { name: 'github', label: 'GitHub MCP', icon: 'fab fa-github', color: 'text-slate-300' },
    { name: 'slack', label: 'Slack MCP', icon: 'fab fa-slack', color: 'text-green-400' },
    { name: 'notion', label: 'Notion MCP', icon: 'fas fa-file-alt', color: 'text-gray-300' },
    { name: 'jira', label: 'Jira MCP', icon: 'fab fa-jira', color: 'text-blue-400' },
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
                    className="w-full justify-start text-white hover:text-white"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`${tab.icon} mr-2 text-white`}></i>
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
                <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-white">
                  <i className="fas fa-times text-white"></i>
                </Button>
              </div>

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  {renderIntegrationSection('aiModels', 'AI Models', aiModels, 'fas fa-brain')}
                  {renderIntegrationSection('cloudStorage', 'Cloud Storage', storageServices, 'fas fa-cloud')}
                  {renderIntegrationSection('processing', 'Processing Providers', processingProviders, 'fas fa-server')}
                  {renderIntegrationSection('mcpServers', 'MCP Servers', mcpServers, 'fas fa-network-wired')}
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="text-center py-8">
                  <i className="fas fa-credit-card text-white text-4xl mb-4"></i>
                  <p className="text-white">Billing settings will be implemented here</p>
                </div>
              )}

              {activeTab === 'usage' && (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-white text-4xl mb-4"></i>
                  <p className="text-white">Usage analytics will be implemented here</p>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="text-center py-8">
                  <i className="fas fa-key text-white text-4xl mb-4"></i>
                  <p className="text-white">API key management will be implemented here</p>
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
