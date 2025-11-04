import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Key, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import josudoLogo from '@assets/Orange Josudo icon_1755945821439.png';
import ApiKeysTab from '@/components/Admin/ApiKeysTab';
import PersonaTemplatesTab from '@/components/Admin/PersonaTemplatesTab';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check admin authentication on mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          setLocation('/admin/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src={josudoLogo} alt="JOSUDO" className="h-16 mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  const handleBackToSite = () => {
    setLocation('/');
    toast({
      title: 'Returning to main site',
      description: 'Leaving admin panel',
    });
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSite}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-back-to-site"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Back to Site
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

          <Tabs defaultValue="keys" className="space-y-6">
            <TabsList className="bg-white border border-gray-200 p-1">
              <TabsTrigger value="keys" className="flex items-center space-x-2" data-testid="tab-api-keys">
                <Key className="w-4 h-4" />
                <span>Platform API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="personas" className="flex items-center space-x-2" data-testid="tab-personas">
                <UserIcon className="w-4 h-4" />
                <span>Digital Personas</span>
              </TabsTrigger>
            </TabsList>

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
