
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { requiredDatasets } from "@/data/codeData";
import { parseCSV, validateDatasetStructure, debugCSVContent } from "@/utils/CSVHelper";
import { useToast } from "@/hooks/use-toast";
import { normalizeCSVColumns, logColumnTransformation } from "@/integrations/supabase/client";

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
  const [validationMessage, setValidationMessage] = useState<{type: 'success' | 'error' | 'warning'; message: string}>({ 
    type: 'warning', 
    message: '' 
  });
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

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

    // Check file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read file");
        }
        
        const fileContent = event.target.result as string;
        
        // Create debug information
        const debug = debugCSVContent(fileContent);
        setDebugInfo(debug);
        console.log("Egress CSV Upload: Debug info", debug);
        
        // Parse CSV
        const result = parseCSV(fileContent);
        
        if (!result.data || result.data.length === 0) {
          throw new Error("No data found in CSV file");
        }
        
        // Normalize CSV column names
        const normalizedData = normalizeCSVColumns(result.data, "zoning"); // Using zoning as fallback
        
        // Log transformation for debugging
        logColumnTransformation(result.data, normalizedData);
        
        // Validate dataset structure with normalized data
        const validation = validateDatasetStructure(normalizedData, "egressRequirements");
        
        if (validation.valid) {
          onDatasetUploaded("egressRequirements", normalizedData);
          setShowEgressAlert(false);
          setValidationMessage({ 
            type: 'success', 
            message: `Successfully uploaded ${normalizedData.length} egress requirement records.` 
          });
          
          toast({
            title: "Dataset Uploaded",
            description: `Successfully uploaded ${normalizedData.length} egress requirement records.`,
          });
          
          // Auto-populate fields if possible
          // This would be implemented based on specific requirements
        } else {
          setShowEgressAlert(true);
          setValidationMessage({ 
            type: 'error', 
            message: validation.message 
          });
          
          toast({
            title: "Validation Error",
            description: validation.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setShowEgressAlert(true);
        const errorMessage = error instanceof Error ? error.message : 'Error parsing CSV file. Please check the format.';
        
        setValidationMessage({ 
          type: 'error', 
          message: errorMessage
        });
        
        // Show debug button since there was an error
        setShowDebugInfo(true);
        
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      setValidationMessage({ 
        type: 'error', 
        message: 'Failed to read the file. Please try again.' 
      });
      
      toast({
        title: "File Error",
        description: 'Failed to read the file. Please try again.',
        variant: "destructive",
      });
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
          <AlertTitle>CSV Format Guideline</AlertTitle>
          <AlertDescription>
            {requiredDatasets.egressRequirements.prompt}
          </AlertDescription>
        </Alert>
      )}
      
      {validationMessage.message && (
        <Alert className={`mb-4 ${validationMessage.type === 'success' ? 'bg-green-50 border-green-200' : validationMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertDescription>
            {validationMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      {showDebugInfo && debugInfo && (
        <div className="mb-4 overflow-auto bg-gray-50 p-3 rounded border">
          <h3 className="text-sm font-medium mb-2">CSV Debug Info:</h3>
          <div className="text-xs max-h-48 overflow-y-auto">
            <p className="font-semibold">Summary: {debugInfo.summary}</p>
            <p className="mt-1">First Row: "{debugInfo.firstRow}"</p>
            <p className="mt-1">Character Codes:</p>
            <pre className="bg-gray-100 p-1 mt-1">{JSON.stringify(debugInfo.charCodes)}</pre>
            <p className="mt-1">First Few Rows:</p>
            <pre className="bg-gray-100 p-1 mt-1">{JSON.stringify(debugInfo.firstFewRows, null, 2)}</pre>
          </div>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowDebugInfo(false)}>
            Hide Debug Info
          </Button>
        </div>
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
          <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
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
