import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requiredDatasets } from "@/data/codeData";
import { parseCSV, checkRequiredColumns } from "@/utils/CSVHelper";

interface LifeSafetyStepProps {
  lifeSafetyData: {
    occupantLoad: string;
    travelDistance: string;
    commonPath: string;
    deadEndCorridors: string;
    exitsRequired: string;
    exitWidths: string;
    corridorSize: string;
    exitDischargeDistance: string;
  };
  onLifeSafetyDataChange: (field: string, value: string) => void;
  onDatasetUploaded: (datasetType: string, data: any[]) => void;
  occupancyData: {
    primaryOccupancy: string;
    buildingArea: string;
  };
}

const LifeSafetyStep = ({ 
  lifeSafetyData, 
  onLifeSafetyDataChange,
  onDatasetUploaded,
  occupancyData
}: LifeSafetyStepProps) => {
  const [showEgressAlert, setShowEgressAlert] = useState(false);

  // Auto calculate occupant load based on primary occupancy and area
  React.useEffect(() => {
    if (occupancyData.primaryOccupancy && occupancyData.buildingArea) {
      let loadFactor = 0;
      
      // This is a simplified calculation - in a real app you'd use actual IBC load factors
      switch(occupancyData.primaryOccupancy) {
        case "a1": loadFactor = 7; break; // 7 sf per occupant
        case "a2": loadFactor = 15; break;
        case "a3": loadFactor = 15; break;
        case "b": loadFactor = 100; break;
        case "e": loadFactor = 20; break;
        case "f1": loadFactor = 100; break;
        case "f2": loadFactor = 100; break;
        case "m": loadFactor = 60; break;
        case "r1": loadFactor = 200; break;
        case "r2": loadFactor = 200; break;
        default: loadFactor = 100;
      }
      
      const area = parseFloat(occupancyData.buildingArea) || 0;
      if (loadFactor > 0 && area > 0) {
        const occupantLoad = Math.ceil(area / loadFactor);
        onLifeSafetyDataChange("occupantLoad", occupantLoad.toString());
      }
    }
  }, [occupancyData.primaryOccupancy, occupancyData.buildingArea]);
  
  // Auto calculate exits required based on occupant load
  React.useEffect(() => {
    const occupantLoad = parseInt(lifeSafetyData.occupantLoad) || 0;
    let exitsRequired = "1";
    
    if (occupantLoad > 500) {
      exitsRequired = "3";
    } else if (occupantLoad > 49) {
      exitsRequired = "2";
    }
    
    onLifeSafetyDataChange("exitsRequired", exitsRequired);
  }, [lifeSafetyData.occupantLoad]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        
        if (checkRequiredColumns(csvData, requiredDatasets.egressRequirements.requiredColumns)) {
          onDatasetUploaded("egressRequirements", csvData.data);
          setShowEgressAlert(false);
        } else {
          console.error("CSV missing required columns");
          setShowEgressAlert(true);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setShowEgressAlert(true);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🚪</span> Life Safety / Egress
      </h2>
      
      {showEgressAlert && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription>
            {requiredDatasets.egressRequirements.prompt}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="occupantLoad">Occupant Load</Label>
                    <Input 
                      id="occupantLoad"
                      type="number"
                      min="1"
                      placeholder="Auto-calculated or enter manually" 
                      value={lifeSafetyData.occupantLoad}
                      onChange={(e) => onLifeSafetyDataChange("occupantLoad", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC Table 1004.5</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="exitsRequired">Exits Required</Label>
                    <Input 
                      id="exitsRequired"
                      type="number"
                      min="1"
                      placeholder="Auto-calculated from occupant load" 
                      value={lifeSafetyData.exitsRequired}
                      onChange={(e) => onLifeSafetyDataChange("exitsRequired", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC 1006.2.1 & 1006.3</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="travelDistance">Max Travel Distance (ft)</Label>
                    <Input 
                      id="travelDistance"
                      type="number"
                      min="0"
                      placeholder="Enter max travel distance" 
                      value={lifeSafetyData.travelDistance}
                      onChange={(e) => onLifeSafetyDataChange("travelDistance", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC Table 1017.2</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="commonPath">Common Path (ft)</Label>
                    <Input 
                      id="commonPath"
                      type="number"
                      min="0"
                      placeholder="Enter common path limit" 
                      value={lifeSafetyData.commonPath}
                      onChange={(e) => onLifeSafetyDataChange("commonPath", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC Table 1006.2.1</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="deadEndCorridors">Dead-End Corridors (ft)</Label>
                    <Input 
                      id="deadEndCorridors"
                      type="number"
                      min="0"
                      placeholder="Enter dead-end corridor limit" 
                      value={lifeSafetyData.deadEndCorridors}
                      onChange={(e) => onLifeSafetyDataChange("deadEndCorridors", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC 1020.4</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exitWidths">Exit Widths (in)</Label>
            <Input 
              id="exitWidths"
              placeholder="Enter exit widths" 
              value={lifeSafetyData.exitWidths}
              onChange={(e) => onLifeSafetyDataChange("exitWidths", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="corridorSize">Corridor/Stair Sizes (in)</Label>
            <Input 
              id="corridorSize"
              placeholder="Enter corridor/stair sizes" 
              value={lifeSafetyData.corridorSize}
              onChange={(e) => onLifeSafetyDataChange("corridorSize", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="exitDischargeDistance">Exit Discharge Distance (ft)</Label>
                    <Input 
                      id="exitDischargeDistance"
                      type="number"
                      min="0"
                      placeholder="Enter exit discharge distance" 
                      value={lifeSafetyData.exitDischargeDistance}
                      onChange={(e) => onLifeSafetyDataChange("exitDischargeDistance", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC 1028.5</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="pt-4">
          <div className="file-upload-area">
            <label htmlFor="egressCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Missing egress data?</p>
                <p className="text-sm text-gray-500">Upload egress requirements CSV file</p>
              </div>
              <input
                id="egressCsvUpload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LifeSafetyStep;
