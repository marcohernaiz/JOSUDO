import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  Download,
  RefreshCw,
  X,
  Zap,
  Clock,
  Activity
} from 'lucide-react';

interface CreditTransaction {
  id: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'expiry';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  metadata?: any;
}

interface UsageLog {
  id: number;
  modelUsed: string;
  tokensConsumed: number;
  creditsDeducted: number;
  timestamp: string;
  status: string;
  metadata?: any;
}

interface CurrentMonthUsage {
  totalTokens: number;
  totalCredits: number;
  totalRequests: number;
  period: {
    start: string;
    end: string;
  };
}

interface UsageModalProps {
  open: boolean;
  onClose: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({ open, onClose }) => {
  const { user } = useAppContext();
  const [currentCredits, setCurrentCredits] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageLog[]>([]);
  const [currentMonthUsage, setCurrentMonthUsage] = useState<CurrentMonthUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && user?.id) {
      fetchUsageData();
    }
  }, [open, user?.id]);

  const fetchUsageData = async () => {
    setIsLoading(true);
    try {
      const [creditsRes, transactionsRes, usageRes, monthUsageRes] = await Promise.all([
        fetch('/api/user/credits', { credentials: 'include' }),
        fetch('/api/user/credit-transactions?limit=100', { credentials: 'include' }),
        fetch('/api/user/usage-history?limit=100', { credentials: 'include' }),
        fetch('/api/user/current-month-usage', { credentials: 'include' }),
      ]);

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCurrentCredits(creditsData.credits);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsageHistory(usageData);
      }

      if (monthUsageRes.ok) {
        const monthUsageData = await monthUsageRes.json();
        setCurrentMonthUsage(monthUsageData);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'usage':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'refund':
        return <CreditCard className="w-4 h-4 text-orange-600" />;
      case 'bonus':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'usage':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'refund':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'bonus':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Usage & Credits Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsageData}
              disabled={isLoading}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Credit Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Credit Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCredits(currentCredits)} credits
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Available for AI model usage
                </p>
              </CardContent>
            </Card>

            {/* Current Month Usage */}
            {currentMonthUsage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tokens Used This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCredits(currentMonthUsage.totalTokens)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Credits Consumed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCredits(currentMonthUsage.totalCredits)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {currentMonthUsage.totalRequests}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Recent Activity</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {transactions.length > 0 ? `${transactions.length} transactions this month` : 'No recent activity'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Usage Period</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {currentMonthUsage ? `${new Date(currentMonthUsage.period.start).toLocaleDateString()} - ${new Date(currentMonthUsage.period.end).toLocaleDateString()}` : 'Loading...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Credit Transactions</CardTitle>
                <CardDescription>
                  History of all credit purchases and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCredits(transaction.amount)} credits
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Balance: {formatCredits(transaction.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No transactions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Usage History</CardTitle>
                <CardDescription>
                  Detailed log of AI model usage and token consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageHistory.map((usage) => (
                    <div
                      key={usage.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {usage.modelUsed}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(usage.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCredits(usage.tokensConsumed)} tokens
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {formatCredits(usage.creditsDeducted)} credits
                        </div>
                      </div>
                    </div>
                  ))}
                  {usageHistory.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      No usage history found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>
                  Insights and trends from your AI usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Model Usage Distribution</h4>
                    <div className="space-y-2">
                      {usageHistory.reduce((acc, usage) => {
                        acc[usage.modelUsed] = (acc[usage.modelUsed] || 0) + usage.tokensConsumed;
                        return acc;
                      }, {} as Record<string, number>)
                      .map(([model, tokens]) => (
                        <div key={model} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{model}</span>
                          <span className="font-medium">{formatCredits(tokens)} tokens</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Recent Trends</h4>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <p>• Average tokens per request: {usageHistory.length > 0 ? Math.round(usageHistory.reduce((sum, u) => sum + u.tokensConsumed, 0) / usageHistory.length) : 0}</p>
                      <p>• Most used model: {usageHistory.length > 0 ? usageHistory.reduce((acc, u) => {
                        acc[u.modelUsed] = (acc[u.modelUsed] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' : 'N/A'}</p>
                      <p>• Total cost this month: ${currentMonthUsage ? (currentMonthUsage.totalCredits * 0.01).toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

