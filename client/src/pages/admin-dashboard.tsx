import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Key, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import josudoLogo from '@assets/Orange Josudo icon_1755945821439.png';
import AdminUsersTab from '@/components/Admin/AdminUsersTab';
import ApiKeysTab from '@/components/Admin/ApiKeysTab';
import PersonaTemplatesTab from '@/components/Admin/PersonaTemplatesTab';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/session');
      const data = await response.json();

      if (data.authenticated) {
        setAdminUser(data.admin);
      } else {
        setLocation('/admin/login');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setLocation('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
      setLocation('/admin/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="h-full px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={josudoLogo} alt="JOSUDO" className="h-8" />
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{adminUser?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Administration Dashboard
          </h1>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-white border border-gray-200 p-1">
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Admin Users</span>
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="personas" className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Digital Personas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <AdminUsersTab />
            </TabsContent>

            <TabsContent value="keys">
              <ApiKeysTab />
            </TabsContent>

            <TabsContent value="personas">
              <PersonaTemplatesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
