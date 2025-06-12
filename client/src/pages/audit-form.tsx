import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, X, Check } from "lucide-react";
import { ProgressBar } from "@/components/audit/progress-bar";
import { CustomerInfo } from "@/components/audit/customer-info";
import { PreAuditInfo } from "@/components/audit/pre-audit-info";
import { HouseInfo } from "@/components/audit/house-info";
import { BlowerDoorTest } from "@/components/audit/blower-door-test";
import { DepressurizationTest } from "@/components/audit/depressurization-test";
import type { Audit } from "@shared/schema";
import type { AuditData } from "@/lib/auditTypes";

export default function AuditForm() {
  const [, params] = useRoute("/audit/:id?");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [auditData, setAuditData] = useState<AuditData>({});
  const [auditId, setAuditId] = useState<string | null>(params?.id || null);
  const [finalFormSaved, setFinalFormSaved] = useState(false);

  const totalScreens = 5;

  // Load existing audit if ID is provided
  const { data: existingAudit, isLoading: auditLoading } = useQuery<Audit>({
    queryKey: ["/api/audits", auditId],
    enabled: !!auditId,
    retry: false,
  });

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: async (data: AuditData) => {
      const response = await apiRequest("POST", "/api/audits", data);
      return response.json();
    },
    onSuccess: (newAudit: Audit) => {
      setAuditId(newAudit.id);
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Audit Created",
        description: "Your audit has been saved successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create audit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update audit mutation
  const updateAuditMutation = useMutation({
    mutationFn: async (data: AuditData) => {
      const response = await apiRequest("PUT", `/api/audits/${auditId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Failed to update audit:", error);
    },
  });

  // Load existing audit data
  useEffect(() => {
    // Handle both single audit object and array response
    const audit = Array.isArray(existingAudit) ? existingAudit.find(a => a.id === auditId) : existingAudit;
    
    if (audit) {
      setAuditData({
        customerFirstName: audit.customerFirstName || "",
        customerLastName: audit.customerLastName || "",
        customerEmail: audit.customerEmail || "",
        customerPhone: audit.customerPhone || "",
        customerAddress: audit.customerAddress || "",
        customerCity: audit.customerCity || "",
        customerProvince: audit.customerProvince || "",
        customerPostalCode: audit.customerPostalCode || "",
        auditType: audit.auditType || "",
        homeType: audit.homeType || "",
        auditDate: audit.auditDate ? new Date(audit.auditDate).toISOString().split('T')[0] : "",
        eligibilityCriteria: audit.eligibilityCriteria || {},
        preAuditDiscussion: audit.preAuditDiscussion || {},
        atypicalLoads: audit.atypicalLoads || {},
        houseInfo: audit.houseInfo || {},
        foundationInfo: audit.foundationInfo || {},
        wallsInfo: audit.wallsInfo || {},
        ceilingInfo: audit.ceilingInfo || {},
        windowsInfo: audit.windowsInfo || {},
        doorsInfo: audit.doorsInfo || {},
        ventilationInfo: audit.ventilationInfo || {},
        heatingInfo: audit.heatingInfo || {},
        domesticHotWaterInfo: audit.domesticHotWaterInfo || {},
        renewablesInfo: audit.renewablesInfo || {},
        blowerDoorTest: audit.blowerDoorTest || {},
        depressurizationTest: audit.depressurizationTest || {},
      });
      
      // If existing audit has depressurization test data, mark as saved
      if (audit.depressurizationTest && 
          (audit.depressurizationTest.windowLeakage || audit.depressurizationTest.otherLeakage)) {
        setFinalFormSaved(true);
      }
    }
  }, [existingAudit, auditId]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (auditId && Object.keys(auditData).length > 0) {
        // Get current status from server to preserve completed audits
        let currentStatus = "in_progress";
        try {
          const response = await apiRequest("GET", `/api/audits/${auditId}`);
          const currentAudit = await response.json();
          currentStatus = currentAudit.status;
        } catch (error) {
          console.error("Auto-save: Failed to fetch current audit status:", error);
          currentStatus = existingAudit?.status || "in_progress";
        }
        
        const statusToSave = currentStatus === "completed" ? "completed" : "in_progress";
        updateAuditMutation.mutate({ ...auditData, status: statusToSave });
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [auditData, auditId]);

  // Handle auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const handleDataUpdate = (section: string, data: any) => {
    setAuditData(prev => ({ ...prev, [section]: data }));
  };

  const handleDirectDataUpdate = (data: any) => {
    setAuditData(prev => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    try {
      // Get the current audit status from the server to ensure we have the latest data
      let currentStatus = "in_progress";
      if (auditId) {
        try {
          const response = await apiRequest("GET", `/api/audits/${auditId}`);
          const currentAudit = await response.json();
          currentStatus = currentAudit.status;
        } catch (error) {
          console.error("Failed to fetch current audit status:", error);
          // Fallback to existing audit data
          currentStatus = existingAudit?.status || "in_progress";
        }
      }
      
      // Preserve completed status, otherwise set to in_progress
      const statusToSave = currentStatus === "completed" ? "completed" : "in_progress";
      
      if (!auditId) {
        await createAuditMutation.mutateAsync({ ...auditData, status: statusToSave });
      } else {
        await updateAuditMutation.mutateAsync({ ...auditData, status: statusToSave });
      }

      if (currentScreen < totalScreens) {
        setCurrentScreen(currentScreen + 1);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Error",
        description: "Failed to save audit data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSaveFinalForm = async () => {
    try {
      // Get current status from server to preserve completed audits
      let currentStatus = "in_progress";
      if (auditId) {
        try {
          const response = await apiRequest("GET", `/api/audits/${auditId}`);
          const currentAudit = await response.json();
          currentStatus = currentAudit.status;
        } catch (error) {
          console.error("Failed to fetch current audit status for final form save:", error);
          currentStatus = existingAudit?.status || "in_progress";
        }
      }
      
      const statusToSave = currentStatus === "completed" ? "completed" : "in_progress";
      
      if (auditId) {
        await updateAuditMutation.mutateAsync({ ...auditData, status: statusToSave });
      } else {
        const newAudit = await createAuditMutation.mutateAsync({ ...auditData, status: statusToSave });
        setAuditId(newAudit.id);
      }
      setFinalFormSaved(true);
      toast({
        title: "Form Saved",
        description: "Your depressurization test data has been saved.",
      });
    } catch (error) {
      console.error("Failed to save final form:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save form data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (!finalFormSaved) {
      toast({
        title: "Save Required",
        description: "Please save the depressurization test data before completing the audit.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (auditId) {
        await updateAuditMutation.mutateAsync({ ...auditData, status: "completed" });
      } else {
        await createAuditMutation.mutateAsync({ ...auditData, status: "completed" });
      }

      toast({
        title: "Audit Completed",
        description: "Your audit has been completed successfully!",
      });

      setLocation("/");
    } catch (error) {
      console.error("Failed to complete audit:", error);
    }
  };

  const handleClose = () => {
    setLocation("/");
  };

  if (authLoading || auditLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit form...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 1:
        return (
          <CustomerInfo
            data={auditData}
            onUpdate={handleDirectDataUpdate}
          />
        );
      case 2:
        return (
          <PreAuditInfo
            data={auditData}
            onUpdate={handleDataUpdate}
            auditId={auditId}
          />
        );
      case 3:
        return (
          <HouseInfo
            data={auditData}
            onUpdate={handleDataUpdate}
          />
        );
      case 4:
        return (
          <BlowerDoorTest
            data={auditData.blowerDoorTest || {}}
            onUpdate={(data) => handleDataUpdate("blowerDoorTest", data)}
          />
        );
      case 5:
        return (
          <DepressurizationTest
            data={auditData.depressurizationTest || {}}
            onUpdate={(data) => handleDataUpdate("depressurizationTest", data)}
            auditId={auditId}
            onSave={handleSaveFinalForm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Home Energy Audit</h2>
              <p className="text-sm text-gray-600">
                {existingAudit ? "Editing existing audit" : "Creating new audit"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <ProgressBar current={currentScreen} total={totalScreens} />
      </header>

      {/* Form Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {renderCurrentScreen()}

          {/* Navigation */}
          <Card className="card-shadow mt-8">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentScreen === 1}
                  className="btn-touch"
                >
                  Previous
                </Button>

                {currentScreen === totalScreens ? (
                  <Button
                    onClick={handleComplete}
                    disabled={createAuditMutation.isPending || updateAuditMutation.isPending || auditData.status === 'completed' || !finalFormSaved}
                    className={`btn-touch ${auditData.status === 'completed' ? 'bg-gray-500' : !finalFormSaved ? 'bg-gray-400' : 'bg-accent'} text-white hover:${auditData.status === 'completed' ? 'bg-gray-600' : !finalFormSaved ? 'bg-gray-500' : 'bg-green-600'}`}
                  >
                    {createAuditMutation.isPending || updateAuditMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {auditData.status === 'completed' ? 'Audit Submitted' : !finalFormSaved ? 'Save Data First' : 'Complete Audit'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={createAuditMutation.isPending || updateAuditMutation.isPending}
                    className="btn-touch bg-primary text-white hover:bg-blue-700"
                  >
                    {createAuditMutation.isPending || updateAuditMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : null}
                    Continue
                  </Button>
                )}
              </div>

              {/* Auto-save indicator */}
              {(createAuditMutation.isPending || updateAuditMutation.isPending) && (
                <div className="flex items-center justify-center mt-4 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Saving...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
