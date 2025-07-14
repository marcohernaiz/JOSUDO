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
      <div className="border border-slate-700/60 rounded-lg overflow-hidden shadow-lg shadow-slate-900/20 hover:shadow-cyan-400/5 transition-all duration-200">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-700/90 transition-all duration-200 backdrop-blur-sm"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl text-cyan-400">
              {icon === 'fas fa-brain' ? '🧠' : 
               icon === 'fas fa-cloud' ? '☁️' : 
               icon === 'fas fa-server' ? '🖥️' : 
               icon === 'fas fa-network-wired' ? '🌐' : '⚙️'}
            </span>
            <h4 className="text-sm font-medium text-white">{title}</h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 bg-slate-900/80 space-y-3 backdrop-blur-sm">
            {items.map((item) => {
              const integration = getIntegrationStatus(item.name);
              return (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-4 bg-slate-800/70 border border-slate-700/50 rounded-lg hover:bg-slate-800/90 hover:border-slate-600/60 transition-all duration-200 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl ${integration ? 'text-green-500' : item.color}`}>
                      {item.icon}
                    </span>
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
                          className="text-white hover:text-red-400"
                        >
                          🔗
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
    { name: 'deepseek', label: 'DeepSeek R1', icon: '🤖', color: 'text-green-400' },
    { name: 'mixtral', label: 'Mixtral 8x7B', icon: '⚡', color: 'text-purple-400' },
    { name: 'openai', label: 'OpenAI GPT-4', icon: '🧠', color: 'text-green-400' },
    { name: 'claude', label: 'Anthropic Claude', icon: '🤖', color: 'text-purple-400' },
    { name: 'gemini', label: 'Google Gemini', icon: '⭐', color: 'text-blue-400' },
    { name: 'grok', label: 'xAI Grok', icon: '⚡', color: 'text-yellow-400' },
    { name: 'llama', label: 'Meta Llama', icon: '🔥', color: 'text-red-400' },
  ];

  const storageServices = [
    { name: 'google_drive', label: 'Google Drive', icon: '💾', color: 'text-blue-400' },
    { name: 'dropbox', label: 'Dropbox', icon: '💾', color: 'text-cyan-400' },
    { name: 'icloud', label: 'Apple iCloud', icon: '☁️', color: 'text-slate-300' },
    { name: 'onedrive', label: 'Microsoft OneDrive', icon: '💾', color: 'text-indigo-400' },
    { name: 'box', label: 'Box', icon: '📦', color: 'text-indigo-400' },
    { name: 'aws_s3', label: 'Amazon S3', icon: '🗄️', color: 'text-orange-400' },
    { name: 'github', label: 'GitHub Storage', icon: '🐙', color: 'text-slate-300' },
    { name: 'gitlab', label: 'GitLab Storage', icon: '🦊', color: 'text-red-400' },
  ];

  const processingProviders = [
    { name: 'aws', label: 'Amazon Web Services', icon: '🚀', color: 'text-orange-400' },
    { name: 'google_cloud', label: 'Google Cloud Platform', icon: '☁️', color: 'text-blue-400' },
    { name: 'azure', label: 'Microsoft Azure', icon: '🌐', color: 'text-cyan-400' },
    { name: 'josudo', label: 'Josudo Processing', icon: '⚡', color: 'text-orange-400' },
  ];

  const mcpServers = [
    { name: 'github', label: 'GitHub MCP', icon: '🐙', color: 'text-slate-300' },
    { name: 'slack', label: 'Slack MCP', icon: '💬', color: 'text-green-400' },
    { name: 'notion', label: 'Notion MCP', icon: '📝', color: 'text-gray-300' },
    { name: 'jira', label: 'Jira MCP', icon: '🎯', color: 'text-blue-400' },
    { name: 'discord', label: 'Discord MCP', icon: '💬', color: 'text-purple-400' },
    { name: 'trello', label: 'Trello MCP', icon: '📋', color: 'text-blue-400' },
    { name: 'asana', label: 'Asana MCP', icon: '✅', color: 'text-pink-400' },
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
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-slate-900 border-2 border-slate-700/50 shadow-2xl shadow-cyan-400/10 overflow-hidden">
          <div className="flex h-full">
            {/* Settings Sidebar */}
            <div className="w-64 bg-slate-800/90 border-r border-slate-700/60 backdrop-blur-sm flex flex-col">
              <div className="p-6 border-b border-slate-700/60">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">Settings</DialogTitle>
                </DialogHeader>
              </div>
              <nav className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
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
            <div className="flex-1 bg-slate-900/95 backdrop-blur-sm flex flex-col">
              <div className="p-6 border-b border-slate-700/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-white">
                    <i className="fas fa-times text-white"></i>
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    {renderIntegrationSection('aiModels', 'AI Models', aiModels, 'fas fa-brain')}
                    {renderIntegrationSection('cloudStorage', 'Cloud Storage', storageServices, 'fas fa-cloud')}
                    {renderIntegrationSection('processing', 'Processing Providers', processingProviders, 'fas fa-server')}
                    {renderIntegrationSection('mcpServers', 'MCP Servers', mcpServers, 'fas fa-network-wired')}
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">Billing Information</h4>
                      <p className="text-white">Monthly Balance: $50.00</p>
                      <p className="text-white">Last Billing Date: July 1, 2025</p>
                      <p className="text-white">Overage Amount: $0.00</p>
                    </div>
                  </div>
                )}

                {activeTab === 'usage' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">Usage Statistics</h4>
                      <p className="text-white">Tokens Used This Month: 15,000</p>
                      <p className="text-white">API Calls Made: 250</p>
                      <p className="text-white">Storage Used: 2.5 GB</p>
                    </div>
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">API Configuration</h4>
                      <p className="text-white">Manage your API keys and integrations here.</p>
                    </div>
                  </div>
                )}
              </div>
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
