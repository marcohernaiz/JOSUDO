import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { GoogleDriveChatHistory } from './GoogleDriveChatHistory';
import { PaymentModal } from '../Modals/PaymentModal';
import { UsageModal } from '../Modals/UsageModal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CreditCard, LogOut, Settings, BarChart3 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAppContext();
  const { isAuthenticated } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserCredits();
    }
  }, [isAuthenticated, user?.id]);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handlePaymentSuccess = () => {
    // Refresh credits after successful payment
    fetchUserCredits();
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.username}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Credits Display */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Credits</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {userCredits.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowPaymentModal(true)}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Buy Credits
          </Button>
          <Button
            onClick={() => setShowUsageModal(true)}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 min-h-0">
        <GoogleDriveChatHistory />
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onShowUsage={() => {
          setShowPaymentModal(false);
          setShowUsageModal(true);
        }}
      />

      {/* Usage Modal */}
      <UsageModal
        open={showUsageModal}
        onClose={() => setShowUsageModal(false)}
      />
    </div>
  );
};