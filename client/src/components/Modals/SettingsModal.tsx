import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ApiKeyModal } from './ApiKeyModal';
import { ChevronDown, ChevronRight, TrendingUp, Zap, DollarSign, Clock, RefreshCw } from 'lucide-react';

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

  // Fetch usage data
  const { data: usageData, isLoading: usageLoading, error: usageError, refetch: refetchUsage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      console.log('📊 Fetching usage data...');
      const response = await apiRequest('GET', '/api/usage');
      console.log('📊 Usage data received:', response);
      return response;
    },
    enabled: false, // Disabled by default, we'll manually trigger it
    retry: (failureCount, error) => {
      console.log('❌ Usage query failed:', error);
      return failureCount < 3;
    },
  });

  // Refetch usage data whenever the usage tab becomes active
  useEffect(() => {
    if (open && activeTab === 'usage') {
      console.log('🔄 Usage tab activated, refetching data...');
      refetchUsage();
    }
  }, [open, activeTab, refetchUsage]);

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
    // Replicate removed - now using default API key in backend
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
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-white dark:bg-slate-900 border-2 border-slate-300/50 dark:border-slate-700/50 shadow-2xl shadow-cyan-400/10 overflow-hidden">
          <div className="flex h-full">
            {/* Settings Sidebar */}
            <div className="w-64 bg-slate-200/90 dark:bg-slate-800/90 border-r border-slate-300/60 dark:border-slate-700/60 backdrop-blur-sm flex flex-col">
              <div className="p-6 border-b border-slate-300/60 dark:border-slate-700/60">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-black dark:text-white">Settings</DialogTitle>
                </DialogHeader>
              </div>
              <nav className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    className="w-full justify-start text-black dark:text-white hover:text-black dark:hover:text-white"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`${tab.icon} mr-2 text-black dark:text-white`}></i>
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col">
              <div className="p-6 border-b border-slate-300/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={onClose} className="text-black dark:text-white hover:text-black dark:hover:text-white">
                    <i className="fas fa-times text-black dark:text-white"></i>
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
                    <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-black dark:text-white mb-4">Billing Information</h4>
                      <p className="text-black dark:text-white">Monthly Balance: $50.00</p>
                      <p className="text-black dark:text-white">Last Billing Date: July 1, 2025</p>
                      <p className="text-black dark:text-white">Overage Amount: $0.00</p>
                    </div>
                  </div>
                )}

                {activeTab === 'usage' && (
                  <div className="space-y-6">
                    {/* Usage Header with Refresh Button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-black dark:text-white">Usage Statistics</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('🔄 Manual refresh triggered');
                          refetchUsage();
                        }}
                        disabled={usageLoading}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${usageLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    {usageLoading ? (
                      <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <p className="text-black dark:text-white">Loading usage data...</p>
                      </div>
                    ) : usageError ? (
                      <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <p className="text-red-500">Failed to load usage data. Please try again.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => refetchUsage()}
                          className="mt-2"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Billing Overview */}
                        {usageData?.billing && (
                          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-black dark:text-white">Monthly Usage</h4>
                              <Badge variant={usageData.billing.isOverLimit ? "destructive" : usageData.billing.isNearLimit ? "secondary" : "default"}>
                                {usageData.billing.planType.charAt(0).toUpperCase() + usageData.billing.planType.slice(1)} Plan
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Current Month</p>
                                <p className="text-2xl font-bold text-black dark:text-white">
                                  ${usageData.billing.currentMonth.toFixed(4)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Limit</p>
                                <p className="text-2xl font-bold text-black dark:text-white">
                                  ${usageData.billing.limit.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                                <p className={`text-2xl font-bold ${usageData.billing.remainingCredit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ${usageData.billing.remainingCredit.toFixed(4)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Usage Progress Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Usage Progress</span>
                                <span className="text-sm font-medium text-black dark:text-white">
                                  {usageData.billing.usagePercentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    usageData.billing.isOverLimit ? 'bg-red-500' :
                                    usageData.billing.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usageData.billing.usagePercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Alerts */}
                            {usageData.billing.isOverLimit && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  ⚠️ You have exceeded your monthly usage limit. Additional usage may incur overage charges.
                                </p>
                              </div>
                            )}
                            
                            {usageData.billing.isNearLimit && !usageData.billing.isOverLimit && (
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                  ⚡ You're approaching your monthly usage limit. Consider upgrading your plan.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tokens</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                  {usageData?.totalTokens?.toLocaleString() || '0'}
                                </p>
                              </div>
                              <Zap className="h-8 w-8 text-blue-500" />
                            </div>
                          </div>
                          
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Cost</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                  ${usageData?.totalCost?.toFixed(4) || '0.0000'}
                                </p>
                              </div>
                              <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                          </div>
                          
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">API Calls</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                  {usageData?.totalRequests || '0'}
                                </p>
                              </div>
                              <TrendingUp className="h-8 w-8 text-purple-500" />
                            </div>
                          </div>
                          
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg Cost</p>
                                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                  ${((usageData?.totalCost || 0) / (usageData?.totalRequests || 1)).toFixed(4)}
                                </p>
                              </div>
                              <Clock className="h-8 w-8 text-orange-500" />
                            </div>
                          </div>
                        </div>

                        {/* Model Usage Breakdown */}
                        <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                          <h4 className="text-lg font-semibold text-black dark:text-white mb-4">Usage by Model</h4>
                          {usageData?.modelUsage && Object.keys(usageData.modelUsage).length > 0 ? (
                            <div className="space-y-4">
                              {Object.entries(usageData.modelUsage).map(([model, data]: [string, any]) => (
                                <div key={model} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      model === 'deepseek-v3' ? 'bg-blue-500' :
                                      model.includes('gpt') ? 'bg-green-500' :
                                      model.includes('claude') ? 'bg-purple-500' :
                                      model.includes('gemini') ? 'bg-yellow-500' :
                                      'bg-gray-500'
                                    }`}></div>
                                    <div>
                                      <p className="font-medium text-black dark:text-white">
                                        {model === 'deepseek-v3' ? 'DeepSeek V3' :
                                         model === 'gpt-4' ? 'GPT-4' :
                                         model === 'claude-3-5-sonnet' ? 'Claude 3.5 Sonnet' :
                                         model === 'gemini-pro' ? 'Gemini Pro' :
                                         model.charAt(0).toUpperCase() + model.slice(1)}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {data.requests} requests
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-black dark:text-white">
                                      {data.tokens.toLocaleString()} tokens
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      ${data.cost.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 dark:text-gray-400 mb-2">No usage data available yet</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">Start using AI models to see your usage statistics!</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => refetchUsage()}
                                className="mt-4"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Again
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Recent Usage */}
                        {usageData?.recentUsage && usageData.recentUsage.length > 0 && (
                          <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                            <h4 className="text-lg font-semibold text-black dark:text-white mb-4">Recent Activity</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {usageData.recentUsage.map((usage: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded text-sm">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                      usage.modelUsed === 'deepseek-v3' ? 'bg-blue-500' :
                                      usage.modelUsed.includes('gpt') ? 'bg-green-500' :
                                      usage.modelUsed.includes('claude') ? 'bg-purple-500' :
                                      'bg-gray-500'
                                    }`}></div>
                                    <span className="text-black dark:text-white">
                                      {usage.modelUsed === 'deepseek-v3' ? 'DeepSeek V3' : usage.modelUsed}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                                    <span>{usage.tokensConsumed} tokens</span>
                                    <span>${parseFloat(usage.cost).toFixed(4)}</span>
                                    <span>{new Date(usage.timestamp).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'api' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-200 dark:bg-slate-800 rounded-lg">
                      <h4 className="text-lg font-semibold text-black dark:text-white mb-4">API Configuration</h4>
                      <p className="text-black dark:text-white">Manage your API keys and integrations here.</p>
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
