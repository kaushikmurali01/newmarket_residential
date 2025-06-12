import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Camera, Upload, X, Eye } from "lucide-react";
import type { AuditPhoto } from "@shared/schema";

interface PhotoUploadProps {
  category: string;
  label: string;
  auditId: string | null;
}

export function PhotoUpload({ category, label, auditId }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<AuditPhoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<AuditPhoto | null>(null);
  const { toast } = useToast();

  // Query existing photos for this category
  const { data: photos = [], isLoading } = useQuery<AuditPhoto[]>({
    queryKey: ["/api/audits", auditId, "photos", category],
    queryFn: async () => {
      if (!auditId) return [];
      const response = await apiRequest("GET", `/api/audits/${auditId}/photos?category=${category}`);
      return response.json();
    },
    enabled: !!auditId,
    retry: false,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!auditId) {
        throw new Error("Audit must be saved before uploading photos");
      }

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("category", category);

      const response = await fetch(`/api/audits/${auditId}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/audits", auditId, "photos", category] 
      });
      toast({
        title: "Photo Uploaded",
        description: "Photo has been uploaded successfully.",
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
        title: "Upload Failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("DELETE", `/api/photos/${photoId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/audits", auditId, "photos", category] 
      });
      toast({
        title: "Photo Deleted",
        description: "Photo has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePhoto = (photo: AuditPhoto) => {
    setDeletingPhoto(photo);
  };

  const confirmDelete = () => {
    if (deletingPhoto) {
      deleteMutation.mutate(deletingPhoto.id);
      setDeletingPhoto(null);
    }
  };

  const handleViewPhoto = (photo: AuditPhoto) => {
    setViewingPhoto(photo);
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!auditId) {
      toast({
        title: "Save Required",
        description: "Please save the audit before uploading photos.",
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Validate each file
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (not an image)`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large - max 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: "Some files couldn't be uploaded",
        description: invalidFiles.join(", "),
        variant: "destructive",
      });
    }

    // Upload valid files sequentially
    if (validFiles.length > 0) {
      setUploading(true);
      try {
        for (const file of validFiles) {
          await uploadMutation.mutateAsync(file);
        }
        
        if (validFiles.length > 1) {
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${validFiles.length} photos.`,
          });
        }
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setUploading(false);
        // Reset input if it exists
        if (event.target) {
          (event.target as HTMLInputElement).value = "";
        }
      }
    }
  }, [auditId, uploadMutation, toast]);

  const handleCameraCapture = useCallback(() => {
    // For iPad/mobile devices, this will open the camera
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use rear camera
    input.onchange = (e) => handleFileSelect(e as any);
    input.click();
  }, [handleFileSelect]);

  const getCategoryIcon = () => {
    switch (category) {
      case "exterior":
        return "🏠";
      case "heating_system":
        return "🔥";
      case "hot_water":
        return "🚿";
      case "hrv_erv":
        return "💨";
      case "renewables":
        return "☀️";
      case "attic_insulation":
        return "🏠";
      case "blower_door":
        return "📷";
      default:
        return "📷";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-3xl mb-2">{getCategoryIcon()}</div>
            <h4 className="font-medium text-gray-900 mb-1">{label}</h4>
            
            {photos.length > 0 ? (
              <div className="space-y-3">
                <Badge variant="secondary" className="mb-2">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
                </Badge>
                
                {/* Photo list */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {photos.map((photo) => (
                    <div key={photo.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Camera className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{photo.originalName || 'Unknown file'}</span>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span className="text-gray-500">{photo.size ? formatFileSize(photo.size) : 'Unknown size'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleViewPhoto(photo)}
                          title="View photo"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePhoto(photo)}
                          title="Delete photo"
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">
                {auditId ? "Tap to capture or upload photos" : "Save audit to upload photos"}
              </p>
            )}

            {/* Upload buttons */}
            <div className="flex flex-col space-y-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCameraCapture}
                disabled={!auditId || uploading}
                className="w-full"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {uploading ? "Uploading..." : "Take Photo"}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={!auditId || uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!auditId || uploading}
                  className="w-full pointer-events-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span className="ml-2 text-xs text-gray-500">Loading photos...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo viewing modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img 
              src={`/uploads/${viewingPhoto.filename}`}
              alt={viewingPhoto.originalName || 'Photo'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={() => setViewingPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 rounded px-2 py-1 text-sm">
              {viewingPhoto.originalName || 'Unknown file'}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeletingPhoto(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Photo</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deletingPhoto.originalName || 'this photo'}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeletingPhoto(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
