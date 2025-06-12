import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Home, ArrowLeft, Search, Download, Camera, FileText, Zap, Edit, Trash2, Calendar, SortAsc, SortDesc } from "lucide-react";
import type { Audit } from "@shared/schema";
import { generateStreamlinedAuditPDF } from "@/lib/pdfExportStreamlined";

export default function ReviewHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch all audits
  const { data: audits, isLoading: auditsLoading, refetch } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
    retry: false,
  });

  // Sort and filter audits
  const filteredAndSortedAudits = useMemo(() => {
    if (!audits) return [];

    let filtered = audits.filter(audit => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customerName = `${audit.customerFirstName || ''} ${audit.customerLastName || ''}`.toLowerCase();
        const matches = 
          customerName.includes(query) ||
          (audit.customerEmail && audit.customerEmail.toLowerCase().includes(query)) ||
          (audit.customerAddress && audit.customerAddress.toLowerCase().includes(query)) ||
          (audit.customerCity && audit.customerCity.toLowerCase().includes(query));
        
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== "all" && audit.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort audits
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.updatedAt || a.createdAt;
        const dateB = b.updatedAt || b.createdAt;
        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      } else {
        const nameA = `${a.customerFirstName || ''} ${a.customerLastName || ''}`.toLowerCase();
        const nameB = `${b.customerFirstName || ''} ${b.customerLastName || ''}`.toLowerCase();
        const comparison = nameA.localeCompare(nameB);
        return sortOrder === "desc" ? -comparison : comparison;
      }
    });

    return filtered;
  }, [audits, searchQuery, statusFilter, sortBy, sortOrder]);

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
        title: "Failed to delete audit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleDownloadPDF = async (audit: Audit) => {
    try {
      // Fetch audit photos
      const photosResponse = await fetch(`/api/audits/${audit.id}/photos`, {
        credentials: "include",
      });
      
      let photos = [];
      if (photosResponse.ok) {
        photos = await photosResponse.json();
      }

      await generateStreamlinedAuditPDF(audit, photos);
      
      toast({
        title: "PDF Generated",
        description: "PDF report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
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
        a.download = `audit_${auditId}.h2k`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "HOT2000 Export",
          description: "HOT2000 file downloaded successfully.",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export HOT2000 file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSort = (newSortBy: "date" | "name") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Review History</h1>
              <p className="text-sm text-gray-600">View and manage all audits</p>
            </div>
          </div>
          
          <Link href="/">
            <Button className="btn-touch bg-primary text-white hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Filter and Search */}
          <Card className="card-shadow mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by customer name or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-touch pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => toggleSort("date")}
                  className="justify-start"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Sort by Date
                  {sortBy === "date" && (
                    sortOrder === "desc" ? <SortDesc className="h-4 w-4 ml-2" /> : <SortAsc className="h-4 w-4 ml-2" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toggleSort("name")}
                  className="justify-start"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Sort by Name
                  {sortBy === "name" && (
                    sortOrder === "desc" ? <SortDesc className="h-4 w-4 ml-2" /> : <SortAsc className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredAndSortedAudits.length} of {audits?.length || 0} audits
          </div>

          {/* Audits Grid */}
          {auditsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading audits...</p>
            </div>
          ) : filteredAndSortedAudits.length === 0 ? (
            <Card className="card-shadow">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No audits found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search criteria or filters."
                    : "Create your first audit to get started."
                  }
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedAudits.map((audit) => (
                <Card key={audit.id} className="card-shadow hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {audit.customerFirstName} {audit.customerLastName}
                          </h3>
                          {getStatusBadge(audit.status)}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          {audit.customerAddress ? `${audit.customerAddress}, ${audit.customerCity}` : "Address not set"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Updated: {formatDate(audit.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Link href={`/audit/${audit.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        
                        {audit.status === "completed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(audit)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadHOT2000(audit.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              HOT2000
                            </Button>
                          </>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Audit</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the audit for {audit.customerFirstName} {audit.customerLastName}? 
                                This action cannot be undone and will permanently remove all audit data and photos.
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
                    </div>

                    {/* Status Indicators */}
                    {audit.status === "completed" && (
                      <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          PDF Ready
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          HOT2000 Ready
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}