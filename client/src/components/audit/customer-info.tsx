import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AuditData } from "@/lib/auditTypes";

interface CustomerInfoProps {
  data: AuditData;
  onUpdate: (data: any) => void;
}

export function CustomerInfo({ data, onUpdate }: CustomerInfoProps) {
  // Initialize with empty data first, then update via useEffect
  const [formData, setFormData] = useState({
    auditType: "",
    homeType: "",
    customerFirstName: "",
    customerLastName: "",
    customerAddress: "",
    customerCity: "",
    customerProvince: "",
    customerPostalCode: "",
    customerPhone: "",
    customerEmail: "",
    auditDate: new Date().toISOString().split('T')[0],
  });

  // Track if this is the initial load to prevent overwriting parent data
  const [isInitialized, setIsInitialized] = useState(false);

  // Update form data when props change (critical for loading existing audits)
  useEffect(() => {
    const updatedData = {
      auditType: data.auditType || "",
      homeType: data.homeType || "",
      customerFirstName: data.customerFirstName || "",
      customerLastName: data.customerLastName || "",
      customerAddress: data.customerAddress || "",
      customerCity: data.customerCity || "",
      customerProvince: data.customerProvince || "",
      customerPostalCode: data.customerPostalCode || "",
      customerPhone: data.customerPhone || "",
      customerEmail: data.customerEmail || "",
      auditDate: data.auditDate || formData.auditDate,
    };
    
    // Always update form data when props change, even if some fields are empty
    // This ensures data persists when navigating between screens
    setFormData(updatedData);
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [data]);

  // Only send updates to parent after initialization and when user makes changes
  const prevFormDataRef = useRef(formData);
  useEffect(() => {
    // Only update parent if this is after initialization AND the data has actually changed
    if (isInitialized && JSON.stringify(prevFormDataRef.current) !== JSON.stringify(formData)) {
      onUpdate(formData);
      prevFormDataRef.current = formData;
    }
  }, [formData, onUpdate, isInitialized]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Audit Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Audit Type</Label>
            <RadioGroup
              value={formData.auditType}
              onValueChange={(value) => handleChange("auditType", value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="before_upgrade" id="before" />
                <Label htmlFor="before" className="text-gray-700">Before Upgrade</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after_upgrade" id="after" />
                <Label htmlFor="after" className="text-gray-700">After Upgrade</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Home Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Home Type</Label>
            <Select value={formData.homeType} onValueChange={(value) => handleChange("homeType", value)}>
              <SelectTrigger className="input-touch">
                <SelectValue placeholder="Select Home Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_detached">Single Detached</SelectItem>
                <SelectItem value="attached">Attached</SelectItem>
                <SelectItem value="row_end">Row (end)</SelectItem>
                <SelectItem value="row_mid">Row (mid)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Name */}
          <div className="lg:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Customer Name</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={formData.customerFirstName}
                onChange={(e) => handleChange("customerFirstName", e.target.value)}
                className="input-touch"
              />
              <Input
                placeholder="Last Name"
                value={formData.customerLastName}
                onChange={(e) => handleChange("customerLastName", e.target.value)}
                className="input-touch"
              />
            </div>
          </div>

          {/* Customer Address */}
          <div className="lg:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Customer Address</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Street Address"
                value={formData.customerAddress}
                onChange={(e) => handleChange("customerAddress", e.target.value)}
                className="input-touch"
              />
              <Input
                placeholder="City"
                value={formData.customerCity}
                onChange={(e) => handleChange("customerCity", e.target.value)}
                className="input-touch"
              />
              <Select value={formData.customerProvince} onValueChange={(value) => handleChange("customerProvince", value)}>
                <SelectTrigger className="input-touch">
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AB">Alberta</SelectItem>
                  <SelectItem value="BC">British Columbia</SelectItem>
                  <SelectItem value="SK">Saskatchewan</SelectItem>
                  <SelectItem value="MB">Manitoba</SelectItem>
                  <SelectItem value="ON">Ontario</SelectItem>
                  <SelectItem value="QC">Quebec</SelectItem>
                  <SelectItem value="NB">New Brunswick</SelectItem>
                  <SelectItem value="NS">Nova Scotia</SelectItem>
                  <SelectItem value="PE">Prince Edward Island</SelectItem>
                  <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                  <SelectItem value="YT">Yukon</SelectItem>
                  <SelectItem value="NT">Northwest Territories</SelectItem>
                  <SelectItem value="NU">Nunavut</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Postal Code"
                value={formData.customerPostalCode}
                onChange={(e) => handleChange("customerPostalCode", e.target.value)}
                className="input-touch"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</Label>
            <Input
              type="tel"
              placeholder="(000) 000-0000"
              value={formData.customerPhone}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
              className="input-touch"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</Label>
            <Input
              type="email"
              placeholder="customer@email.com"
              value={formData.customerEmail}
              onChange={(e) => handleChange("customerEmail", e.target.value)}
              className="input-touch"
            />
          </div>

          {/* Audit Date */}
          <div className="lg:col-span-2 md:col-span-1">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Audit Date</Label>
            <Input
              type="date"
              value={formData.auditDate}
              onChange={(e) => handleChange("auditDate", e.target.value)}
              className="input-touch"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
