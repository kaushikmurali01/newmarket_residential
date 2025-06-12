import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, History, Download, Eye, ChevronRight, LogOut, Camera, FileText, Zap, Users, Settings, Trash2, Search, Calendar } from "lucide-react";
import enervaLogo from "@assets/Enerva-Vector-Logo-1 (4).svg";
import type { Audit } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: audits, isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    retry: false,
  });

  // Filter and search audits
  const filteredAudits = useMemo(() => {
    if (!audits) return [];

    let filtered = audits.filter(audit => {
      // Search filter - check customer name, email, address, city
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customerName = `${audit.customerFirstName || ''} ${audit.customerLastName || ''}`.toLowerCase();
        const matches = 
          customerName.includes(query) ||
          (audit.customerEmail && audit.customerEmail.toLowerCase().includes(query)) ||
          (audit.customerAddress && audit.customerAddress.toLowerCase().includes(query)) ||
          (audit.customerCity && audit.customerCity.toLowerCase().includes(query)) ||
          (audit.customerPhone && audit.customerPhone.includes(query));
        
        if (!matches) return false;
      }

      // Date filter
      if (dateFilter !== "all" && audit.createdAt) {
        const auditDate = new Date(audit.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            return auditDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return auditDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return auditDate >= monthAgo;
          default:
            return true;
        }
      }

      return true;
    });

    // Sort by most recent first
    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
      return dateB - dateA;
    });
  }, [audits, searchQuery, dateFilter]);

  // Show only 10 audits in the dashboard
  const recentAudits = filteredAudits.slice(0, 10);

  const deleteAuditMutation = useMutation({
    mutationFn: async (auditId: string) => {
      const response = await apiRequest("DELETE", `/api/audits/${auditId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Audit deleted",
        description: "Audit has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete audit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent text-white">Complete</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-white">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const handleDownloadPDF = async (auditId: string) => {
    try {
      // Show loading notification
      const loadingToast = toast({
        title: "Generating PDF Report...",
        description: "Processing high-resolution photos and audit data. This may take a moment.",
        duration: Infinity,
      });

      const { generateAuditPDF } = await import('@/lib/pdfExport');
      
      // Fetch audit data
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
      
      // Generate PDF using streamlined React-PDF renderer
      const { generateStreamlinedAuditPDF } = await import('@/lib/pdfExportStreamlined');
      await generateStreamlinedAuditPDF(audit, photos);
      
      // Dismiss loading and show success
      loadingToast.dismiss();
      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
      
    } catch (error) {
      console.error("PDF download failed:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF report",
        variant: "destructive",
      });
    }
  };

  const handleDownloadHOT2000 = async (auditId: string) => {
    try {
      const response = await fetch(`/api/audits/${auditId}/export/hot2000`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-${auditId}.h2k`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "HOT2000 file downloaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to download HOT2000 file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("HOT2000 download failed:", error);
      toast({
        title: "Error",
        description: "Failed to download HOT2000 file",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-12 flex items-center justify-center">
              <img src={enervaLogo} alt="Enerva" className="h-10 w-auto" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Enerva Audit Tool</h1>
              <p className="text-sm text-gray-600">Residential Energy Audit Tool</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {(user.canManageUsers || user.role === 'admin') && (
              <Link href="/users">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </Button>
              </Link>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              <span>{user.firstName} {user.lastName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage Home Energy Audits</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/audit">
            <Card className="card-shadow hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-accent text-white w-12 h-12 rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">New Audit</h3>
                    <p className="text-gray-600 text-sm">Start a new home energy audit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="card-shadow hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Audits</h3>
                    <p className="text-gray-600 text-sm">View past audits and reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reporting">
            <Card className="card-shadow hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Program Reporting</h3>
                    <p className="text-gray-600 text-sm">View program-level analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Audits */}
        <Card className="card-shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Audits</h3>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by customer name, email, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-400 h-4 w-4" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {auditsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading audits...</p>
              </div>
            ) : !audits || audits.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <FileText className="h-12 w-12 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No audits yet</h4>
                <p className="text-gray-600 mb-4">Start your first home energy audit to see it here</p>
                <Link href="/audit">
                  <Button className="bg-primary text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Audit
                  </Button>
                </Link>
              </div>
            ) : recentAudits.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No audits found</h4>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setDateFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {recentAudits.map((audit) => (
                <div key={audit.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <Link href={`/audit/${audit.id}`} className="flex-1 cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {audit.customerFirstName} {audit.customerLastName} Residence
                          </h4>
                          {getStatusBadge(audit.status)}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          {audit.customerAddress ? `${audit.customerAddress}, ${audit.customerCity}, ${audit.customerProvince}` : "Address not set"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {audit.status === "completed" ? "Completed" : audit.status === "in_progress" ? "In Progress" : "Created"}: {formatDate(audit.updatedAt)}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Camera className="h-3 w-3 mr-1" />
                            Photos
                          </span>
                          {audit.status === "completed" && (
                            <>
                              <span className="text-xs text-gray-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF Ready
                              </span>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Zap className="h-3 w-3 mr-1" />
                                HOT2000 Ready
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-2 ml-4">
                      {audit.status === "completed" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(audit.id);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadHOT2000(audit.id);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            HOT2000
                          </Button>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Audit</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this audit for {audit.customerFirstName} {audit.customerLastName}? This action cannot be undone and will permanently remove all audit data and photos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAuditMutation.mutate(audit.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Audit
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Link href={`/audit/${audit.id}`}>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
                ))}
                
                {/* View All Button */}
                {filteredAudits.length > 10 && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <Link href="/history">
                      <Button variant="outline" className="w-full">
                        View All Audits ({filteredAudits.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
