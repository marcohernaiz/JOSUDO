import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/dashboard";
import Auth from "./pages/auth";
import NotFound from "@/pages/not-found";
import { PaymentSuccess } from "./pages/payment-success";
import DigitalPersonas from "./pages/digital-personas";
import PersonaAdmin from "./pages/persona-admin";
import AdminLogin from "./pages/admin-login";
import AdminDashboard from "./pages/admin-dashboard";

import { Redirect } from 'wouter';

function AdminRedirect() {
  return <Redirect to="/admin/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/digital-personas" component={DigitalPersonas} />
      <Route path="/admin" component={AdminRedirect} />
      <Route path="/admin/personas" component={PersonaAdmin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/auth" component={Auth} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppProvider>
            <Toaster />
            <Router />
          </AppProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
