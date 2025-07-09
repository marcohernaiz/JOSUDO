import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "./contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/dashboard";
import Auth from "./pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-login with demo account if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetch('/api/auth/demo-login', { method: 'POST' })
        .then(() => {
          // Refresh the page to update auth state
          window.location.reload();
        })
        .catch(error => {
          console.error('Auto-login failed:', error);
        });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Router />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
