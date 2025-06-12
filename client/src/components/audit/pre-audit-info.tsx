import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUpload } from "@/components/photo-upload";
import type { AuditData } from "@/lib/auditTypes";

interface PreAuditInfoProps {
  data: AuditData;
  onUpdate: (section: string, data: any) => void;
  auditId: string | null;
}

export function PreAuditInfo({ data, onUpdate, auditId }: PreAuditInfoProps) {
  const [eligibilityCriteria, setEligibilityCriteria] = useState(data.eligibilityCriteria || {});
  const [preAuditDiscussion, setPreAuditDiscussion] = useState(data.preAuditDiscussion || {});
  const [atypicalLoads, setAtypicalLoads] = useState(data.atypicalLoads || {});
  const [confirmEmail, setConfirmEmail] = useState(data.customerEmail || "");

  // Update state when props change (critical for loading existing audits)
  useEffect(() => {
    setEligibilityCriteria(data.eligibilityCriteria || {});
    setPreAuditDiscussion(data.preAuditDiscussion || {});
    setAtypicalLoads(data.atypicalLoads || {});
    if (data.customerEmail) {
      setConfirmEmail(data.customerEmail);
    }
  }, [data.eligibilityCriteria, data.preAuditDiscussion, data.atypicalLoads, data.customerEmail]);

  // Auto-populate email from customer data when it changes
  useEffect(() => {
    if (data.customerEmail && data.customerEmail !== confirmEmail) {
      setConfirmEmail(data.customerEmail);
    }
  }, [data.customerEmail, confirmEmail]);

  useEffect(() => {
    onUpdate("eligibilityCriteria", eligibilityCriteria);
  }, [eligibilityCriteria, onUpdate]);

  useEffect(() => {
    onUpdate("preAuditDiscussion", preAuditDiscussion);
  }, [preAuditDiscussion, onUpdate]);

  useEffect(() => {
    onUpdate("atypicalLoads", atypicalLoads);
  }, [atypicalLoads, onUpdate]);

  const handleEligibilityChange = (field: string, checked: boolean) => {
    setEligibilityCriteria((prev: any) => ({ ...prev, [field]: checked }));
  };

  const handleDiscussionChange = (field: string, checked: boolean) => {
    setPreAuditDiscussion((prev: any) => ({ ...prev, [field]: checked }));
  };

  const handleAtypicalChange = (field: string, checked: boolean) => {
    setAtypicalLoads((prev: any) => ({ ...prev, [field]: checked }));
  };

  // Update email confirmation when it changes
  useEffect(() => {
    if (confirmEmail !== data.customerEmail) {
      onUpdate("customerEmail", confirmEmail);
    }
  }, [confirmEmail, onUpdate, data.customerEmail]);

  const eligibilityItems = [
    { key: "registered", label: "The homeowner has registered in the Program" },
    { key: "documents", label: "Check possible needed documents (Property Tax Roll#)" },
    { key: "storeys", label: "Home is no more than 3 storeys above grade" },
    { key: "size", label: "Home is less than 600 m²" },
    { key: "foundation", label: "Home is on Permanent Foundation" },
    { key: "mechanical", label: "Mechanical is present & operating at time of evaluation" },
    { key: "doors_windows", label: "All Doors & Windows are installed and intact (allowed to seal off 1)" },
    { key: "envelope", label: "Building Envelope is intact (exterior finishes not a component of air barrier exempt)" },
    { key: "renovations", label: "No current renovations to building envelope underway" },
    { key: "ashes", label: "Ashes removed from Fireplace (if applicable)" },
    { key: "electrical", label: "Permanent 15A 120V electrical power source" },
  ];

  const discussionItems = [
    { key: "authorization", label: "Presented Evaluation Authorization Form & customer signed" },
    { key: "process", label: "Explain process of the service customer chose" },
    { key: "access", label: "Confirm location & access for mechanical room, crawlspaces, attic access" },
    { key: "documents", label: "Ask Homeowner for docs for mechanical & any components (windows, renewables, builder plans)" },
  ];

  const atypicalItems = [
    { key: "deicing", label: "Deicing Cables" },
    { key: "lighting", label: "Extensive Exterior Lighting" },
    { key: "hot_tub", label: "Hot Tub" },
    { key: "air_conditioner", label: "Room Air Conditioner" },
    { key: "pool", label: "Swimming Pool" },
  ];

  const photoCategories = [
    { key: "exterior", label: "Exterior all elevations and hidden surfaces", icon: "🏠" },
    { key: "heating_system", label: "Principal heating/AC system", icon: "🔥" },
    { key: "hot_water", label: "Domestic Hot Water", icon: "🚿" },
    { key: "hrv_erv", label: "HRV/ERV (if present)", icon: "💨" },
    { key: "renewables", label: "Renewable energy systems", icon: "☀️" },
    { key: "attic_insulation", label: "Attic Insulation showing type & depth", icon: "🏠" },
    { key: "blower_door", label: "Photo of Blower door", icon: "📷" },
  ];

  return (
    <div className="space-y-8">
      {/* Eligibility Criteria */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Pre-Audit Information</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Criteria</h4>
            <div className="space-y-3">
              {eligibilityItems.map((item) => (
                <div key={item.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={`eligibility-${item.key}`}
                    checked={eligibilityCriteria[item.key] || false}
                    onCheckedChange={(checked) => handleEligibilityChange(item.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`eligibility-${item.key}`} className="text-gray-700 text-sm leading-relaxed">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-audit Discussion */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Pre-audit Discussion</h4>
            <div className="space-y-3">
              {discussionItems.map((item) => (
                <div key={item.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={`discussion-${item.key}`}
                    checked={preAuditDiscussion[item.key] || false}
                    onCheckedChange={(checked) => handleDiscussionChange(item.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`discussion-${item.key}`} className="text-gray-700 text-sm leading-relaxed">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Email (reports will be sent here)
              </Label>
              <Input
                type="email"
                placeholder="Confirm customer email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="input-touch"
              />
            </div>
          </div>

          {/* Atypical Loads */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Atypical Loads</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {atypicalItems.map((item) => (
                <div key={item.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`atypical-${item.key}`}
                    checked={atypicalLoads[item.key] || false}
                    onCheckedChange={(checked) => handleAtypicalChange(item.key, checked as boolean)}
                  />
                  <Label htmlFor={`atypical-${item.key}`} className="text-gray-700">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Required Photos</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {photoCategories.map((category) => (
                <PhotoUpload
                  key={category.key}
                  category={category.key}
                  label={category.label}
                  auditId={auditId}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
