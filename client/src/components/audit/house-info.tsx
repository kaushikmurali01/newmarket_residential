import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { AuditData } from "@/lib/auditTypes";



interface HouseInfoProps {
  data: AuditData;
  onUpdate: (section: string, data: any) => void;
}

export function HouseInfo({ data, onUpdate }: HouseInfoProps) {
  const [houseInfo, setHouseInfo] = useState(data.houseInfo || {});
  const [foundationInfo, setFoundationInfo] = useState(data.foundationInfo || {});
  const [wallsInfo, setWallsInfo] = useState(data.wallsInfo || {});
  const [ceilingInfo, setCeilingInfo] = useState(data.ceilingInfo || {});
  const [windowsInfo, setWindowsInfo] = useState(data.windowsInfo || {});
  const [doorsInfo, setDoorsInfo] = useState(data.doorsInfo || {});
  const [ventilationInfo, setVentilationInfo] = useState(data.ventilationInfo || {});
  const [heatingInfo, setHeatingInfo] = useState(data.heatingInfo || {});
  const [domesticHotWaterInfo, setDomesticHotWaterInfo] = useState(data.domesticHotWaterInfo || {});
  const [renewablesInfo, setRenewablesInfo] = useState(data.renewablesInfo || {});

  // Initialize floors if not present or ensure they have complete structure
  const initializeFloors = () => {
    if (!wallsInfo.floors || wallsInfo.floors.length === 0) {
      const defaultFloors = [
        { 
          id: "basement", 
          name: "Basement", 
          wallHeight: "", 
          wallHeightUnit: "m",
          wallHeightFeet: "",
          wallHeightInches: ""
        },
        { 
          id: "main", 
          name: "Main Floor", 
          wallHeight: "", 
          wallHeightUnit: "m",
          wallHeightFeet: "",
          wallHeightInches: ""
        }
      ];
      setWallsInfo(prev => ({ ...prev, floors: defaultFloors }));
    } else {
      // Ensure existing floors have the complete structure
      const updatedFloors = wallsInfo.floors.map(floor => ({
        ...floor,
        wallHeightFeet: floor.wallHeightFeet || "",
        wallHeightInches: floor.wallHeightInches || ""
      }));
      if (JSON.stringify(updatedFloors) !== JSON.stringify(wallsInfo.floors)) {
        setWallsInfo(prev => ({ ...prev, floors: updatedFloors }));
      }
    }
  };

  // Initialize floors on component mount
  useEffect(() => {
    initializeFloors();
  }, []);

  const addFloor = () => {
    const floors = wallsInfo.floors || [];
    const floorNumber = floors.length - 1; // Subtract basement
    const newFloor = {
      id: `floor-${Date.now()}`,
      name: floorNumber === 1 ? "Second Floor" : floorNumber === 2 ? "Third Floor" : `Floor ${floorNumber + 1}`,
      wallHeight: "",
      wallHeightUnit: "m",
      wallHeightFeet: "",
      wallHeightInches: ""
    };
    setWallsInfo(prev => ({ ...prev, floors: [...floors, newFloor] }));
  };

  const removeFloor = (floorId: string) => {
    const floors = wallsInfo.floors || [];
    // Don't allow removing basement or main floor
    if (floorId === "basement" || floorId === "main") return;
    setWallsInfo(prev => ({ 
      ...prev, 
      floors: floors.filter(floor => floor.id !== floorId) 
    }));
  };

  const updateFloor = (floorId: string, field: string, value: string) => {
    const floors = wallsInfo.floors || [];
    const updatedFloors = floors.map(floor => 
      floor.id === floorId ? { ...floor, [field]: value } : floor
    );
    setWallsInfo(prev => ({ ...prev, floors: updatedFloors }));
  };



  useEffect(() => {
    onUpdate("houseInfo", houseInfo);
  }, [houseInfo, onUpdate]);

  useEffect(() => {
    onUpdate("foundationInfo", foundationInfo);
  }, [foundationInfo, onUpdate]);

  useEffect(() => {
    onUpdate("wallsInfo", wallsInfo);
  }, [wallsInfo, onUpdate]);

  useEffect(() => {
    onUpdate("ceilingInfo", ceilingInfo);
  }, [ceilingInfo, onUpdate]);

  useEffect(() => {
    onUpdate("windowsInfo", windowsInfo);
  }, [windowsInfo, onUpdate]);

  useEffect(() => {
    onUpdate("doorsInfo", doorsInfo);
  }, [doorsInfo, onUpdate]);

  useEffect(() => {
    onUpdate("ventilationInfo", ventilationInfo);
  }, [ventilationInfo, onUpdate]);

  useEffect(() => {
    onUpdate("heatingInfo", heatingInfo);
  }, [heatingInfo, onUpdate]);

  useEffect(() => {
    onUpdate("domesticHotWaterInfo", domesticHotWaterInfo);
  }, [domesticHotWaterInfo, onUpdate]);

  useEffect(() => {
    onUpdate("renewablesInfo", renewablesInfo);
  }, [renewablesInfo, onUpdate]);

  return (
    <div className="space-y-8">
      {/* House Information */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">House Information</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* House Details and Foundation - Two Columns */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* House Details */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">House Details</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">House Type</Label>
                  <Select 
                    value={houseInfo.houseType || ""} 
                    onValueChange={(value) => setHouseInfo((prev: any) => ({ ...prev, houseType: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bungalow">Bungalow</SelectItem>
                      <SelectItem value="2_storey">2 Storey</SelectItem>
                      <SelectItem value="bi_level">Bi-Level</SelectItem>
                      <SelectItem value="split_level">Split Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Year Built</Label>
                  <Input
                    type="number"
                    placeholder="1985"
                    value={houseInfo.yearBuilt || ""}
                    onChange={(e) => setHouseInfo((prev: any) => ({ ...prev, yearBuilt: e.target.value }))}
                    className="input-touch"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Above Grade Height</Label>
                  <div className="flex space-x-2">
                    {houseInfo.aboveGradeHeightUnit === "ft" ? (
                      <>
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="8"
                            value={houseInfo.aboveGradeFeet || ""}
                            onChange={(e) => {
                              const feet = parseFloat(e.target.value) || 0;
                              const inches = parseFloat(houseInfo.aboveGradeInches || "0") || 0;
                              const totalFeet = feet + inches / 12;
                              setHouseInfo((prev: any) => ({ 
                                ...prev, 
                                aboveGradeFeet: e.target.value,
                                aboveGradeHeight: totalFeet.toFixed(3)
                              }));
                            }}
                            className="input-touch text-sm"
                          />
                          <Label className="text-xs text-gray-500 mt-1 block">ft</Label>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            max="11.75"
                            placeholder="6"
                            value={houseInfo.aboveGradeInches || ""}
                            onChange={(e) => {
                              const feet = parseFloat(houseInfo.aboveGradeFeet || "0") || 0;
                              const inches = parseFloat(e.target.value) || 0;
                              const totalFeet = feet + inches / 12;
                              setHouseInfo((prev: any) => ({ 
                                ...prev, 
                                aboveGradeInches: e.target.value,
                                aboveGradeHeight: totalFeet.toFixed(3)
                              }));
                            }}
                            className="input-touch text-sm"
                          />
                          <Label className="text-xs text-gray-500 mt-1 block">in</Label>
                        </div>
                      </>
                    ) : (
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="2.4"
                        value={houseInfo.aboveGradeHeight || ""}
                        onChange={(e) => setHouseInfo((prev: any) => ({ ...prev, aboveGradeHeight: e.target.value }))}
                        className="input-touch flex-1 text-sm"
                      />
                    )}
                    <Select 
                      value={houseInfo.aboveGradeHeightUnit || "m"} 
                      onValueChange={(unit) => {
                        if (unit === "ft" && houseInfo.aboveGradeHeight) {
                          // Convert from metric to feet/inches
                          const meters = parseFloat(houseInfo.aboveGradeHeight);
                          const totalFeet = meters * 3.28084;
                          const feet = Math.floor(totalFeet);
                          const inches = Math.round((totalFeet - feet) * 12 * 4) / 4;
                          setHouseInfo((prev: any) => ({ 
                            ...prev, 
                            aboveGradeHeightUnit: unit,
                            aboveGradeFeet: feet.toString(),
                            aboveGradeInches: inches.toString()
                          }));
                        } else {
                          setHouseInfo((prev: any) => ({ ...prev, aboveGradeHeightUnit: unit }));
                        }
                      }}
                    >
                      <SelectTrigger className="input-touch w-16 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Front Orientation</Label>
                  <Select 
                    value={houseInfo.frontOrientation || ""} 
                    onValueChange={(value) => setHouseInfo((prev: any) => ({ ...prev, frontOrientation: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">N</SelectItem>
                      <SelectItem value="NW">NW</SelectItem>
                      <SelectItem value="W">W</SelectItem>
                      <SelectItem value="SW">SW</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="SE">SE</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="NE">NE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Foundation */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Foundation</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Foundation Type</Label>
                  <div className="space-y-2">
                    {["basement", "crawlspace", "slab"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`foundation-${type}`}
                          checked={foundationInfo.foundationType?.includes(type) || false}
                          onCheckedChange={(checked) => {
                            const current = foundationInfo.foundationType || [];
                            const updated = checked 
                              ? [...current, type]
                              : current.filter((t: string) => t !== type);
                            setFoundationInfo((prev: any) => ({ ...prev, foundationType: updated }));
                          }}
                        />
                        <Label htmlFor={`foundation-${type}`} className="text-gray-700 capitalize">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Crawlspace Type</Label>
                  <Select 
                    value={foundationInfo.crawlspaceType || ""} 
                    onValueChange={(value) => setFoundationInfo((prev: any) => ({ ...prev, crawlspaceType: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="vented">Vented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Pony Wall?</Label>
                  <Select 
                    value={foundationInfo.ponyWall || ""} 
                    onValueChange={(value) => setFoundationInfo((prev: any) => ({ ...prev, ponyWall: value }))}
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
              </div>
            </div>
          </div>

          {/* Walls - Full Width Below */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Walls</h4>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Wall Framing</Label>
                  <Select 
                    value={wallsInfo.wallFraming || ""} 
                    onValueChange={(value) => setWallsInfo((prev: any) => ({ ...prev, wallFraming: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Framing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2x4">2x4</SelectItem>
                      <SelectItem value="2x6">2x6</SelectItem>
                      <SelectItem value="2x8">2x8</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Centres</Label>
                  <Select 
                    value={wallsInfo.centres || ""} 
                    onValueChange={(value) => setWallsInfo((prev: any) => ({ ...prev, centres: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Centres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">400 mm (16")</SelectItem>
                      <SelectItem value="488">488 mm (19.2")</SelectItem>
                      <SelectItem value="600">600 mm (24")</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Floor Wall Heights */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">Wall Heights by Floor</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFloor}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Floor
                  </Button>
                </div>
                <div className="space-y-3">
                  {(wallsInfo.floors || []).map((floor) => (
                    <div key={floor.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">
                          {floor.name}
                        </Label>
                        <div className="flex space-x-2">
                          {floor.wallHeightUnit === "ft" ? (
                            <>
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  placeholder="8"
                                  value={floor.wallHeightFeet || ""}
                                  onChange={(e) => {
                                    const feet = parseFloat(e.target.value) || 0;
                                    const inches = parseFloat(floor.wallHeightInches || "0") || 0;
                                    const totalFeet = feet + inches / 12;
                                    updateFloor(floor.id, "wallHeightFeet", e.target.value);
                                    updateFloor(floor.id, "wallHeight", totalFeet.toFixed(3));
                                  }}
                                  className="input-touch text-sm"
                                />
                                <Label className="text-xs text-gray-500 mt-1 block">ft</Label>
                              </div>
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max="11.75"
                                  placeholder="6"
                                  value={floor.wallHeightInches || ""}
                                  onChange={(e) => {
                                    const feet = parseFloat(floor.wallHeightFeet || "0") || 0;
                                    const inches = parseFloat(e.target.value) || 0;
                                    const totalFeet = feet + inches / 12;
                                    updateFloor(floor.id, "wallHeightInches", e.target.value);
                                    updateFloor(floor.id, "wallHeight", totalFeet.toFixed(3));
                                  }}
                                  className="input-touch text-sm"
                                />
                                <Label className="text-xs text-gray-500 mt-1 block">in</Label>
                              </div>
                            </>
                          ) : (
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="2.4"
                              value={floor.wallHeight || ""}
                              onChange={(e) => updateFloor(floor.id, "wallHeight", e.target.value)}
                              className="input-touch flex-1 text-sm"
                            />
                          )}
                          <Select 
                            value={floor.wallHeightUnit || "m"} 
                            onValueChange={(unit) => {
                              const floors = wallsInfo.floors || [];
                              const updatedFloors = floors.map(f => {
                                if (f.id === floor.id) {
                                  const updatedFloor = { ...f, wallHeightUnit: unit };
                                  if (unit === "ft" && f.wallHeight) {
                                    // Convert from metric to feet/inches if there's an existing value
                                    const meters = parseFloat(f.wallHeight);
                                    const totalFeet = meters * 3.28084;
                                    const feet = Math.floor(totalFeet);
                                    const inches = Math.round((totalFeet - feet) * 12 * 4) / 4;
                                    updatedFloor.wallHeightFeet = feet.toString();
                                    updatedFloor.wallHeightInches = inches.toString();
                                  }
                                  return updatedFloor;
                                }
                                return f;
                              });
                              setWallsInfo(prev => ({ ...prev, floors: updatedFloors }));
                            }}
                          >
                            <SelectTrigger className="input-touch w-16 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              <SelectItem value="m">m</SelectItem>
                              <SelectItem value="ft">ft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {floor.id !== "basement" && floor.id !== "main" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFloor(floor.id)}
                          className="text-red-500 hover:text-red-700 p-1 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Wall Properties */}
            <div className="mt-6 grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Cavity Insulation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["R18", "R19", "R22", "R24"].map((r) => (
                      <div key={r} className="flex items-center space-x-2">
                        <Checkbox
                          id={`insulation-${r}`}
                          checked={wallsInfo.cavityInsulation?.includes(r) || false}
                          onCheckedChange={(checked) => {
                            const current = wallsInfo.cavityInsulation || [];
                            const updated = checked 
                              ? [...current, r]
                              : current.filter((item: string) => item !== r);
                            setWallsInfo((prev: any) => ({ ...prev, cavityInsulation: updated }));
                          }}
                        />
                        <Label htmlFor={`insulation-${r}`} className="text-gray-700">
                          {r}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Exterior Insulation Type</Label>
                  <div className="space-y-2">
                    {["eps", "xps", "mineral_wool"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ext-insulation-${type}`}
                          checked={wallsInfo.exteriorInsulationType?.includes(type) || false}
                          onCheckedChange={(checked) => {
                            const current = wallsInfo.exteriorInsulationType || [];
                            const updated = checked 
                              ? [...current, type]
                              : current.filter((t: string) => t !== type);
                            setWallsInfo((prev: any) => ({ ...prev, exteriorInsulationType: updated }));
                          }}
                        />
                        <Label htmlFor={`ext-insulation-${type}`} className="text-gray-700 capitalize">
                          {type.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Exterior Sheathing</Label>
                  <Select 
                    value={wallsInfo.exteriorSheathing || ""} 
                    onValueChange={(value) => setWallsInfo((prev: any) => ({ ...prev, exteriorSheathing: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Sheathing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="osb">OSB</SelectItem>
                      <SelectItem value="ply">Plywood</SelectItem>
                      <SelectItem value="gypsum">Gypsum</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Exterior Finish</Label>
                  <Select 
                    value={wallsInfo.exteriorFinish || ""} 
                    onValueChange={(value) => setWallsInfo((prev: any) => ({ ...prev, exteriorFinish: value }))}
                  >
                    <SelectTrigger className="input-touch">
                      <SelectValue placeholder="Select Finish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vinyl">Vinyl</SelectItem>
                      <SelectItem value="fibreboard">Fibreboard</SelectItem>
                      <SelectItem value="stone_brick">Stone/Brick</SelectItem>
                      <SelectItem value="stucco">Stucco</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {wallsInfo.exteriorFinish === "other" && (
                    <div className="mt-2">
                      <Input
                        type="text"
                        placeholder="Specify exterior finish"
                        value={wallsInfo.exteriorFinishOther || ""}
                        onChange={(e) => setWallsInfo((prev: any) => ({ ...prev, exteriorFinishOther: e.target.value }))}
                        className="input-touch"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional sections - Windows, Doors, etc. */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Windows */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Windows</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Frame</Label>
                <Select 
                  value={windowsInfo.frame || ""} 
                  onValueChange={(value) => setWindowsInfo((prev: any) => ({ ...prev, frame: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Frame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                    <SelectItem value="pvc">PVC</SelectItem>
                    <SelectItem value="fibreglass">Fibreglass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Low-E Coating</Label>
                <Select 
                  value={windowsInfo.lowECoating || ""} 
                  onValueChange={(value) => setWindowsInfo((prev: any) => ({ ...prev, lowECoating: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Coating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Gas Fill</Label>
                <Select 
                  value={windowsInfo.gasFill || ""} 
                  onValueChange={(value) => setWindowsInfo((prev: any) => ({ ...prev, gasFill: value }))}
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
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Glazing</Label>
                <Select 
                  value={windowsInfo.glazing || ""} 
                  onValueChange={(value) => setWindowsInfo((prev: any) => ({ ...prev, glazing: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Glazing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doors */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Doors</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Skin</Label>
                <Select 
                  value={doorsInfo.skin || ""} 
                  onValueChange={(value) => setDoorsInfo((prev: any) => ({ ...prev, skin: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Skin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steel">Steel</SelectItem>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="fibreglass">Fibreglass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Insulation</Label>
                <Select 
                  value={doorsInfo.insulation || ""} 
                  onValueChange={(value) => setDoorsInfo((prev: any) => ({ ...prev, insulation: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Insulation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibreglass">Fibreglass</SelectItem>
                    <SelectItem value="eps">EPS</SelectItem>
                    <SelectItem value="xps">XPS</SelectItem>
                    <SelectItem value="spray_foam">Spray Foam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ceiling */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Ceiling</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Attic Framing</Label>
                <Select 
                  value={ceilingInfo.atticFraming || ""} 
                  onValueChange={(value) => setCeilingInfo((prev: any) => ({ ...prev, atticFraming: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Framing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="truss">Truss</SelectItem>
                    <SelectItem value="rafters">Rafters</SelectItem>
                    <SelectItem value="2x4">2x4</SelectItem>
                    <SelectItem value="2x6">2x6</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Attic Insulation Type</Label>
                <div className="space-y-2">
                  {["fibreglass", "cellulose", "foam"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attic-insulation-${type}`}
                        checked={ceilingInfo.atticInsulationType?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const current = ceilingInfo.atticInsulationType || [];
                          const updated = checked 
                            ? [...current, type]
                            : current.filter((t: string) => t !== type);
                          setCeilingInfo((prev: any) => ({ ...prev, atticInsulationType: updated }));
                        }}
                      />
                      <Label htmlFor={`attic-insulation-${type}`} className="text-gray-700 capitalize">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Ceiling Type</Label>
                <Select 
                  value={ceilingInfo.ceilingType || ""} 
                  onValueChange={(value) => setCeilingInfo((prev: any) => ({ ...prev, ceilingType: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="cathedral">Cathedral</SelectItem>
                    <SelectItem value="scissor">Scissor</SelectItem>
                    <SelectItem value="attic_gable">Attic Gable</SelectItem>
                    <SelectItem value="attic_hip">Attic Hip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Spacing</Label>
                <Select 
                  value={ceilingInfo.spacing || ""} 
                  onValueChange={(value) => setCeilingInfo((prev: any) => ({ ...prev, spacing: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">400 mm (16")</SelectItem>
                    <SelectItem value="488">488 mm (19.2")</SelectItem>
                    <SelectItem value="600">600 mm (24")</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ventilation Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Ventilation</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Ventilation Type</Label>
                <Select 
                  value={ventilationInfo.ventilationType || ""} 
                  onValueChange={(value) => setVentilationInfo((prev: any) => ({ ...prev, ventilationType: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exhaust_only">Exhaust Only</SelectItem>
                    <SelectItem value="supply_only">Supply Only</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">HRV Manufacturer</Label>
                <Input
                  type="text"
                  value={ventilationInfo.hrvManufacturer || ""}
                  onChange={(e) => setVentilationInfo((prev: any) => ({ ...prev, hrvManufacturer: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter manufacturer"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">HRV Model</Label>
                <Input
                  type="text"
                  value={ventilationInfo.hrvModel || ""}
                  onChange={(e) => setVentilationInfo((prev: any) => ({ ...prev, hrvModel: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter model"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">HVI Certified</Label>
                <Select 
                  value={ventilationInfo.hviCertified || ""} 
                  onValueChange={(value) => setVentilationInfo((prev: any) => ({ ...prev, hviCertified: value }))}
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
              
              {/* Ventilation Devices */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Ventilation Devices</Label>
                <div className="space-y-3">
                  {/* Bath Fan */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="device-bath-fan"
                      checked={!!ventilationInfo.device?.bathFan}
                      onCheckedChange={(checked) => {
                        setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            bathFan: checked ? { cfm: "" } : undefined
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="device-bath-fan" className="text-gray-700">Bath Fan</Label>
                    {ventilationInfo.device?.bathFan && (
                      <Input
                        type="number"
                        placeholder="CFM"
                        value={ventilationInfo.device.bathFan.cfm || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            bathFan: { ...prev.device.bathFan, cfm: e.target.value }
                          }
                        }))}
                        className="input-touch w-20 text-sm"
                      />
                    )}
                  </div>
                  
                  {/* Range Hood */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="device-range-hood"
                      checked={!!ventilationInfo.device?.rangeHood}
                      onCheckedChange={(checked) => {
                        setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            rangeHood: checked ? { cfm: "" } : undefined
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="device-range-hood" className="text-gray-700">Range Hood</Label>
                    {ventilationInfo.device?.rangeHood && (
                      <Input
                        type="number"
                        placeholder="CFM"
                        value={ventilationInfo.device.rangeHood.cfm || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            rangeHood: { ...prev.device.rangeHood, cfm: e.target.value }
                          }
                        }))}
                        className="input-touch w-20 text-sm"
                      />
                    )}
                  </div>
                  
                  {/* Utility Fan */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="device-utility-fan"
                      checked={!!ventilationInfo.device?.utilityFan}
                      onCheckedChange={(checked) => {
                        setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            utilityFan: checked ? { cfm: "" } : undefined
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="device-utility-fan" className="text-gray-700">Utility Fan</Label>
                    {ventilationInfo.device?.utilityFan && (
                      <Input
                        type="number"
                        placeholder="CFM"
                        value={ventilationInfo.device.utilityFan.cfm || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          device: {
                            ...prev.device,
                            utilityFan: { ...prev.device.utilityFan, cfm: e.target.value }
                          }
                        }))}
                        className="input-touch w-20 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Device Detail Sections */}
              {/* Bath Fan Details */}
              {ventilationInfo.device?.bathFan && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">Bath Fan Details</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Manufacturer</Label>
                      <Input
                        type="text"
                        value={ventilationInfo.bathFanDetails?.manufacturer || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          bathFanDetails: { ...prev.bathFanDetails, manufacturer: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="Enter manufacturer"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Model</Label>
                      <Input
                        type="text"
                        value={ventilationInfo.bathFanDetails?.model || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          bathFanDetails: { ...prev.bathFanDetails, model: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="Enter model"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Exhaust Flow (CFM)</Label>
                      <Input
                        type="number"
                        value={ventilationInfo.bathFanDetails?.exhaustFlow || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          bathFanDetails: { ...prev.bathFanDetails, exhaustFlow: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="CFM"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Fan Power (Watts)</Label>
                      <Input
                        type="number"
                        value={ventilationInfo.bathFanDetails?.fanPower || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          bathFanDetails: { ...prev.bathFanDetails, fanPower: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="Watts"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Range Hood Details */}
              {ventilationInfo.device?.rangeHood && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">Range Hood Details</Label>
                  <div>
                    <Label className="text-xs text-gray-600">Manufacturer</Label>
                    <Input
                      type="text"
                      value={ventilationInfo.rangeHoodDetails?.manufacturer || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({
                        ...prev,
                        rangeHoodDetails: { ...prev.rangeHoodDetails, manufacturer: e.target.value }
                      }))}
                      className="input-touch text-sm"
                      placeholder="Enter manufacturer"
                    />
                  </div>
                </div>
              )}

              {/* Utility Fan Details */}
              {ventilationInfo.device?.utilityFan && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">Utility Fan Details</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600">Manufacturer</Label>
                      <Input
                        type="text"
                        value={ventilationInfo.utilityFanDetails?.manufacturer || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          utilityFanDetails: { ...prev.utilityFanDetails, manufacturer: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="Enter manufacturer"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Flow Rate (S/E)</Label>
                      <Input
                        type="text"
                        value={ventilationInfo.utilityFanDetails?.flowRate || ""}
                        onChange={(e) => setVentilationInfo((prev: any) => ({
                          ...prev,
                          utilityFanDetails: { ...prev.utilityFanDetails, flowRate: e.target.value }
                        }))}
                        className="input-touch text-sm"
                        placeholder="S/E flow rate"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">HRV CFM</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Supply</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.hrvCfm?.supply || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        hrvCfm: { ...prev.hrvCfm, supply: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="CFM"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Exhaust</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.hrvCfm?.exhaust || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        hrvCfm: { ...prev.hrvCfm, exhaust: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="CFM"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Fan Power (Watts)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">At 0°C</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.fanPower?.at0C || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        fanPower: { ...prev.fanPower, at0C: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Watts"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">At -25°C</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.fanPower?.atMinus25 || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        fanPower: { ...prev.fanPower, atMinus25: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Watts"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sensible Efficiency (%)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">At 0°C</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.sensibleEfficiency?.at0C || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        sensibleEfficiency: { ...prev.sensibleEfficiency, at0C: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="%"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">At -25°C</Label>
                    <Input
                      type="number"
                      value={ventilationInfo.sensibleEfficiency?.atMinus25C || ""}
                      onChange={(e) => setVentilationInfo((prev: any) => ({ 
                        ...prev, 
                        sensibleEfficiency: { ...prev.sensibleEfficiency, atMinus25C: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heating Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Heating System</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Heating System Type</Label>
                <div className="space-y-2">
                  {["furnace", "boiler", "combo", "integrated", "csa_p9_11", "heat_pump"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`heating-${type}`}
                        checked={heatingInfo.heatingSystemType?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const current = heatingInfo.heatingSystemType || [];
                          const updated = checked 
                            ? [...current, type]
                            : current.filter((t: string) => t !== type);
                          setHeatingInfo((prev: any) => ({ ...prev, heatingSystemType: updated }));
                        }}
                      />
                      <Label htmlFor={`heating-${type}`} className="text-gray-700 capitalize">
                        {type.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Source</Label>
                <Select 
                  value={heatingInfo.source || ""} 
                  onValueChange={(value) => setHeatingInfo((prev: any) => ({ ...prev, source: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ng">Natural Gas</SelectItem>
                    <SelectItem value="propane">Propane</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</Label>
                <Input
                  type="text"
                  value={heatingInfo.manufacturer || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, manufacturer: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter manufacturer"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Model</Label>
                <Input
                  type="text"
                  value={heatingInfo.model || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, model: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter model"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Rated Efficiency</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Overall (%)</Label>
                    <Input
                      type="number"
                      value={heatingInfo.ratedEfficiency?.overall || ""}
                      onChange={(e) => setHeatingInfo((prev: any) => ({ 
                        ...prev, 
                        ratedEfficiency: { ...prev.ratedEfficiency, overall: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Overall efficiency"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">AFUE (%)</Label>
                    <Input
                      type="number"
                      value={heatingInfo.ratedEfficiency?.afue || ""}
                      onChange={(e) => setHeatingInfo((prev: any) => ({ 
                        ...prev, 
                        ratedEfficiency: { ...prev.ratedEfficiency, afue: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="AFUE"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Steady State (%)</Label>
                    <Input
                      type="number"
                      value={heatingInfo.ratedEfficiency?.steadyState || ""}
                      onChange={(e) => setHeatingInfo((prev: any) => ({ 
                        ...prev, 
                        ratedEfficiency: { ...prev.ratedEfficiency, steadyState: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Steady state"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Ignition Type</Label>
                <Select 
                  value={heatingInfo.ignitionType || ""} 
                  onValueChange={(value) => setHeatingInfo((prev: any) => ({ ...prev, ignitionType: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="electric_ignition">Electric Ignition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Automatic Vent (Flue) Damper</Label>
                <Select 
                  value={heatingInfo.automaticVentDamper || ""} 
                  onValueChange={(value) => setHeatingInfo((prev: any) => ({ ...prev, automaticVentDamper: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes_motorized">Yes - Motorized Damper</SelectItem>
                    <SelectItem value="no_fixed_barometric">No - Fixed/Barometric</SelectItem>
                    <SelectItem value="na_sealed_combustion">N/A - Sealed Combustion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Dedicated Combustion Air Duct</Label>
                <Input
                  type="text"
                  value={heatingInfo.dedicatedCombustionAirDuct || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, dedicatedCombustionAirDuct: e.target.value }))}
                  className="input-touch"
                  placeholder="Non-dampered duct details"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Fan/Pump Motor Type</Label>
                <Select 
                  value={heatingInfo.fanPumpMotorType || ""} 
                  onValueChange={(value) => setHeatingInfo((prev: any) => ({ ...prev, fanPumpMotorType: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Motor Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecm_motor">ECM Motor</SelectItem>
                    <SelectItem value="psc_motor">PSC Motor</SelectItem>
                    <SelectItem value="vfd_motor">VFD Motor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Venting Configuration</Label>
                <Select 
                  value={heatingInfo.ventingConfiguration || ""} 
                  onValueChange={(value) => setHeatingInfo((prev: any) => ({ ...prev, ventingConfiguration: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="induced_draft">Induced Draft</SelectItem>
                    <SelectItem value="sealed_combustion">Sealed Combustion</SelectItem>
                    <SelectItem value="furnace_with_pilot">Furnace with Pilot</SelectItem>
                    <SelectItem value="condensing">Condensing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Heat Pump Section */}
              {heatingInfo.heatingSystemType?.includes("heat_pump") && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <Label className="text-sm font-semibold text-blue-800 mb-2 block">Heat Pump Details</Label>
                  <div>
                    <Label className="text-xs text-gray-600">Heat Pump Manufacturer</Label>
                    <Input
                      type="text"
                      value={heatingInfo.heatPumpManufacturer || ""}
                      onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, heatPumpManufacturer: e.target.value }))}
                      className="input-touch text-sm"
                      placeholder="Enter manufacturer"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Heat Pump Model (Condenser & Coils)</Label>
                    <Input
                      type="text"
                      value={heatingInfo.heatPumpModel || ""}
                      onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, heatPumpModel: e.target.value }))}
                      className="input-touch text-sm"
                      placeholder="Enter model"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Supplementary Heating System</Label>
                <Input
                  type="text"
                  value={heatingInfo.supplementaryHeatingSystem || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, supplementaryHeatingSystem: e.target.value }))}
                  className="input-touch"
                  placeholder="Optional - describe supplementary system"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">A/C Coil</Label>
                <Input
                  type="text"
                  value={heatingInfo.acCoil || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, acCoil: e.target.value }))}
                  className="input-touch"
                  placeholder="A/C coil details"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Condenser Unit</Label>
                <Input
                  type="text"
                  value={heatingInfo.condenserUnit || ""}
                  onChange={(e) => setHeatingInfo((prev: any) => ({ ...prev, condenserUnit: e.target.value }))}
                  className="input-touch"
                  placeholder="Condenser unit details"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domestic Hot Water Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Domestic Hot Water (DHW)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">DHW Type</Label>
                <Select 
                  value={domesticHotWaterInfo.domesticHotWaterType || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, domesticHotWaterType: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conv_tank">Conventional Tank</SelectItem>
                    <SelectItem value="tankless">Tankless</SelectItem>
                    <SelectItem value="induced_direct_vent">Induced Direct Vent</SelectItem>
                    <SelectItem value="cond_tank">Condensing Tank</SelectItem>
                    <SelectItem value="tankless_coil">Tankless Coil</SelectItem>
                    <SelectItem value="conserver">Conserver</SelectItem>
                    <SelectItem value="heat_pump">Heat Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Fuel</Label>
                <Select 
                  value={domesticHotWaterInfo.fuel || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, fuel: value }))}
                >
                  <SelectTrigger className="input-touch">
                    <SelectValue placeholder="Select Fuel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="nat_gas">Natural Gas</SelectItem>
                    <SelectItem value="propane">Propane</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</Label>
                <Input
                  type="text"
                  value={domesticHotWaterInfo.manufacturer || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, manufacturer: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter manufacturer"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Model</Label>
                <Input
                  type="text"
                  value={domesticHotWaterInfo.model || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, model: e.target.value }))}
                  className="input-touch"
                  placeholder="Enter model"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Tank Volume (L)</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.tankVolume || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, tankVolume: e.target.value }))}
                  className="input-touch"
                  placeholder="Litres"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Efficiency Factor</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.efficiencyFactor || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, efficiencyFactor: e.target.value }))}
                  className="input-touch"
                  placeholder="EF"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">COP</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.cop || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, cop: e.target.value }))}
                  className="input-touch"
                  placeholder="COP"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Pilot</Label>
                <Select 
                  value={domesticHotWaterInfo.pilot || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, pilot: value }))}
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
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Co-Vented</Label>
                <Select 
                  value={domesticHotWaterInfo.coVented || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, coVented: value }))}
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
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Flue Diameter (inches)</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.flueDiameter || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, flueDiameter: e.target.value }))}
                  className="input-touch"
                  placeholder="Diameter in inches"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block"># of Showers to Main Stack</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.showersToMainStack || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, showersToMainStack: e.target.value }))}
                  className="input-touch"
                  placeholder="Number of showers"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">DWHR Present</Label>
                <Select 
                  value={domesticHotWaterInfo.dwhr?.present || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ 
                    ...prev, 
                    dwhr: { ...prev.dwhr, present: value }
                  }))}
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
              {domesticHotWaterInfo.dwhr?.present === "yes" && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">DWHR Manufacturer</Label>
                    <Input
                      type="text"
                      value={domesticHotWaterInfo.dwhr?.manufacturer || ""}
                      onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ 
                        ...prev, 
                        dwhr: { ...prev.dwhr, manufacturer: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Enter manufacturer"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">DWHR Model</Label>
                    <Input
                      type="text"
                      value={domesticHotWaterInfo.dwhr?.model || ""}
                      onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ 
                        ...prev, 
                        dwhr: { ...prev.dwhr, model: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Enter model"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">DWHR Size (inches)</Label>
                    <Input
                      type="text"
                      value={domesticHotWaterInfo.dwhr?.size || ""}
                      onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ 
                        ...prev, 
                        dwhr: { ...prev.dwhr, size: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Size in inches"
                    />
                  </div>
                </>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">DWHR to Shower</Label>
                <Select 
                  value={domesticHotWaterInfo.dwhrToShower || ""} 
                  onValueChange={(value) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, dwhrToShower: value }))}
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
                <Label className="text-sm font-medium text-gray-700 mb-2 block"># of Low Flush Toilets</Label>
                <Input
                  type="number"
                  value={domesticHotWaterInfo.lowFlushToilets || ""}
                  onChange={(e) => setDomesticHotWaterInfo((prev: any) => ({ ...prev, lowFlushToilets: e.target.value }))}
                  className="input-touch"
                  placeholder="Number of toilets"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renewables Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Renewables</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-medium text-gray-900 mb-3 block">Solar PV</Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Present</Label>
                    <Select 
                      value={renewablesInfo.solarPv?.present || ""} 
                      onValueChange={(value) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarPv: { ...prev.solarPv, present: value }
                      }))}
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
                  {renewablesInfo.solarPv?.present === "yes" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</Label>
                        <Input
                          type="text"
                          value={renewablesInfo.solarPv?.manufacturer || ""}
                          onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                            ...prev, 
                            solarPv: { ...prev.solarPv, manufacturer: e.target.value }
                          }))}
                          className="input-touch"
                          placeholder="Enter manufacturer"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Area (m²)</Label>
                        <Input
                          type="number"
                          value={renewablesInfo.solarPv?.area || ""}
                          onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                            ...prev, 
                            solarPv: { ...prev.solarPv, area: e.target.value }
                          }))}
                          className="input-touch"
                          placeholder="Square meters"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Module Type</Label>
                        <div className="space-y-2">
                          {["mono_si", "poly_si", "a_si", "cd_te", "cis"].map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`solar-module-${type}`}
                                checked={renewablesInfo.solarPv?.moduleType?.includes(type) || false}
                                onCheckedChange={(checked) => {
                                  const current = renewablesInfo.solarPv?.moduleType || [];
                                  const updated = checked 
                                    ? [...current, type]
                                    : current.filter((t: string) => t !== type);
                                  setRenewablesInfo((prev: any) => ({ 
                                    ...prev, 
                                    solarPv: { ...prev.solarPv, moduleType: updated }
                                  }));
                                }}
                              />
                              <Label htmlFor={`solar-module-${type}`} className="text-gray-700">
                                {type.replace(/_/g, '-').toUpperCase()}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-medium text-gray-900 mb-3 block">Solar DHW</Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Manufacturer</Label>
                    <Input
                      type="text"
                      value={renewablesInfo.solarDhw?.manufacturer || ""}
                      onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarDhw: { ...prev.solarDhw, manufacturer: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Enter manufacturer"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Model</Label>
                    <Input
                      type="text"
                      value={renewablesInfo.solarDhw?.model || ""}
                      onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarDhw: { ...prev.solarDhw, model: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Enter model"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">CSA F379 Rating</Label>
                    <Input
                      type="text"
                      value={renewablesInfo.solarDhw?.csaF379Rating || ""}
                      onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarDhw: { ...prev.solarDhw, csaF379Rating: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Enter rating"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Slope (degrees)</Label>
                    <Input
                      type="number"
                      value={renewablesInfo.solarDhw?.slope || ""}
                      onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarDhw: { ...prev.solarDhw, slope: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Degrees"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Azimuth (degrees)</Label>
                    <Input
                      type="number"
                      value={renewablesInfo.solarDhw?.azimuth || ""}
                      onChange={(e) => setRenewablesInfo((prev: any) => ({ 
                        ...prev, 
                        solarDhw: { ...prev.solarDhw, azimuth: e.target.value }
                      }))}
                      className="input-touch"
                      placeholder="Degrees"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}