import { useAppContext } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageLog } from '@/types';

export const Header: React.FC = () => {
  const { integrations } = useAppContext();

  const { data: usage = [] } = useQuery<UsageLog[]>({
    queryKey: ['/api/usage'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const totalTokens = usage.reduce((sum, log) => sum + log.tokensConsumed, 0);
  const totalCost = usage.reduce((sum, log) => sum + parseFloat(log.cost), 0);

  const activeModel = integrations.find(i => i.serviceType === 'ai_model' && i.isActive);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border-b border-slate-600/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-slate-100">Josudo</h1>
          <Badge variant="secondary" className="bg-green-600/20 text-green-300 border border-green-500/30">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
            Connected
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Usage Indicator */}
          <div className="flex items-center space-x-2 text-sm text-slate-300">
            <i className="fas fa-chart-line text-slate-400"></i>
            <span>{totalTokens.toLocaleString()} tokens</span>
            <span className="text-slate-500">•</span>
            <span>${totalCost.toFixed(2)} used</span>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Usage Details" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50">
              <i className="fas fa-chart-bar"></i>
            </Button>
            <Button variant="ghost" size="sm" title="API Documentation" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50">
              <i className="fas fa-code"></i>
            </Button>
            <Button variant="ghost" size="sm" title="Notifications" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700/50">
              <i className="fas fa-bell"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
