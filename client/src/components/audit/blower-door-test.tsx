import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface BlowerDoorTestProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function BlowerDoorTest({ data, onUpdate }: BlowerDoorTestProps) {
  const [testData, setTestData] = useState({
    areasOfLeakage: data.areasOfLeakage || {},
    windowComponent: data.windowComponent || "",
    other: data.other || "",
    ...data,
  });

  useEffect(() => {
    onUpdate(testData);
  }, [testData, onUpdate]);

  const leakageAreas = [
    { key: "rims", label: "Rims" },
    { key: "electric_outlet", label: "Electric Outlet" },
    { key: "doors", label: "Doors" },
    { key: "wall_intersections", label: "Wall Intersections" },
    { key: "baseboards", label: "Baseboards" },
    { key: "ceiling_fixtures", label: "Ceiling Fixtures" },
    { key: "window_frames", label: "Window Frames" },
    { key: "electric_panel", label: "Electric Panel" },
    { key: "attic_access", label: "Attic Access" },
  ];

  const handleLeakageChange = (area: string, checked: boolean) => {
    setTestData(prev => ({
      ...prev,
      areasOfLeakage: {
        ...prev.areasOfLeakage,
        [area]: checked,
      },
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Blower Door Test</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Areas of Leakage</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {leakageAreas.map((area) => (
              <div key={area.key} className="flex items-center space-x-3">
                <Checkbox
                  id={`leakage-${area.key}`}
                  checked={testData.areasOfLeakage[area.key] || false}
                  onCheckedChange={(checked) => handleLeakageChange(area.key, checked as boolean)}
                />
                <Label htmlFor={`leakage-${area.key}`} className="text-gray-700">
                  {area.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Window Component</Label>
              <Input
                placeholder="Specify window component"
                value={testData.windowComponent}
                onChange={(e) => handleInputChange("windowComponent", e.target.value)}
                className="input-touch"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Other</Label>
              <Input
                placeholder="Describe other areas"
                value={testData.other}
                onChange={(e) => handleInputChange("other", e.target.value)}
                className="input-touch"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-blue-700 text-sm font-medium">
              Blower door test results will be recorded during the physical testing phase
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
