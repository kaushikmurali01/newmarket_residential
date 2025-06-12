import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Check } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

interface DepressurizationTestProps {
  data: any;
  onUpdate: (data: any) => void;
  auditId: string | null;
  onSave?: () => void;
}

export function DepressurizationTest({ data, onUpdate, auditId, onSave }: DepressurizationTestProps) {
  const { toast } = useToast();
  const [testData, setTestData] = useState(() => {
    // Extract depressurization test data from the audit data
    const existingData = data.depressurizationTest || data;
    return {
      windowLeakage: existingData.windowLeakage || "",
      otherLeakage: existingData.otherLeakage || "",
    };
  });
  
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    onUpdate({ depressurizationTest: testData });
    if (isInitialized) {
      setHasChanges(true);
      setIsSaved(false);
    }
  }, [testData, onUpdate, isInitialized]);

  useEffect(() => {
    // Mark as initialized after first render to avoid triggering hasChanges on load
    setIsInitialized(true);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave();
        setIsSaved(true);
        setHasChanges(false);
      } catch (error) {
        console.error("Save failed:", error);
      }
    }
  };

  const isFormComplete = testData.windowLeakage.trim() !== "" && testData.otherLeakage.trim() !== "";

  const handleExportPDF = async () => {
    if (!auditId) return;
    
    try {
      // Show loading notification
      const loadingToast = toast({
        title: "Generating PDF Report...",
        description: "Processing high-resolution photos and audit data. This may take a moment.",
        duration: Infinity,
      });

      const { generateStreamlinedAuditPDF } = await import('@/lib/pdfExportStreamlined');
      
      // Fetch audit data for PDF generation
      const response = await fetch(`/api/audits/${auditId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        loadingToast.dismiss();
        toast({
          title: "Error",
          description: "Failed to fetch audit data",
          variant: "destructive",
        });
        return;
      }
      
      const audit = await response.json();
      
      // Fetch photos
      const photosResponse = await fetch(`/api/audits/${auditId}/photos`, {
        credentials: "include",
      });
      
      const photos = photosResponse.ok ? await photosResponse.json() : [];
      
      // Generate complete streamlined PDF report with all sections
      await generateStreamlinedAuditPDF(audit, photos);
      
      // Dismiss loading and show success
      loadingToast.dismiss();
      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
      
    } catch (error) {
      console.error("PDF export failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleExportHOT2000 = async () => {
    if (!auditId) return;
    
    try {
      const response = await fetch(`/api/audits/${auditId}/export/hot2000`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_${auditId}.h2k`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("HOT2000 export failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Depressurization Test & Completion</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-6 mb-8">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Is there leakage from window component?
              </Label>
              <Select 
                value={testData.windowLeakage} 
                onValueChange={(value) => handleInputChange("windowLeakage", value)}
              >
                <SelectTrigger className="input-touch">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Is there leakage from other areas?
              </Label>
              <Textarea
                rows={4}
                placeholder="Describe any leakage from other areas"
                value={testData.otherLeakage}
                onChange={(e) => handleInputChange("otherLeakage", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSaved && !hasChanges && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={!isFormComplete || (!hasChanges && isSaved)}
                className={`btn-touch ${
                  !isFormComplete || (!hasChanges && isSaved)
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-400"
                    : "bg-primary text-white hover:bg-blue-700"
                }`}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Data
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Export Options</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!auditId}
              className="h-auto p-4 hover:border-primary transition-colors text-left justify-start"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <h5 className="font-medium text-gray-900">Export PDF Report</h5>
                  <p className="text-sm text-gray-600">Complete audit report with photos</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={handleExportHOT2000}
              disabled={!auditId}
              className="h-auto p-4 hover:border-primary transition-colors text-left justify-start"
            >
              <div className="flex items-center space-x-3">
                <Download className="h-8 w-8 text-primary" />
                <div>
                  <h5 className="font-medium text-gray-900">Export HOT2000 File</h5>
                  <p className="text-sm text-gray-600">Generate .h2k file for analysis</p>
                </div>
              </div>
            </Button>
          </div>

          {!auditId && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Save the audit first to enable export options
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
