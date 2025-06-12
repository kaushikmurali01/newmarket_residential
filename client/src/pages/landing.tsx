import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, FileText, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="card-shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="bg-primary text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enerva Audit Tool</h1>
              <p className="text-gray-600">Professional Home Energy Auditing Platform</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Users className="h-5 w-5 text-primary" />
                <span>Secure team authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <FileText className="h-5 w-5 text-primary" />
                <span>Comprehensive audit forms</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-primary" />
                <span>iPad-optimized interface</span>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full btn-touch bg-primary text-white hover:bg-blue-700"
            >
              Sign In to Enerva
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure team authentication for energy auditors
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
