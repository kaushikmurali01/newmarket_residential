import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import AuditForm from "@/pages/audit-form";
import ReviewHistory from "@/pages/review-history";
import UserManagement from "@/pages/user-management";
import ProgramReporting from "@/pages/program-reporting";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <Dashboard />} />
      <ProtectedRoute path="/audit/:id?" component={() => <AuditForm />} />
      <ProtectedRoute path="/history" component={() => <ReviewHistory />} />
      <ProtectedRoute path="/users" component={() => <UserManagement />} />
      <ProtectedRoute path="/reporting" component={() => <ProgramReporting />} />
      <Route path="/auth" component={() => <AuthPage />} />
      <Route component={() => <NotFound />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
