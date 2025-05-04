
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requiredDatasets } from "@/data/codeData";
import { parseCSV, checkRequiredColumns } from "@/utils/CSVHelper";

interface FireRatingsStepProps {
  fireData: {
    fireSeparationDistance: string;
    exteriorWallRating: string;
    openingProtection: string;
    shaftEnclosures: string;
    doorWindowRatings: string;
  };
  onFireDataChange: (field: string, value: string) => void;
  onDatasetUploaded: (datasetType: string, data: any[]) => void;
  constructionType: string;
}

const FireRatingsStep = ({ 
  fireData, 
  onFireDataChange,
  onDatasetUploaded,
  constructionType
}: FireRatingsStepProps) => {
  const [showFireAlert, setShowFireAlert] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        
        if (checkRequiredColumns(csvData, requiredDatasets.fireRatings.requiredColumns)) {
          onDatasetUploaded("fireRatings", csvData);
          setShowFireAlert(false);
        } else {
          console.error("CSV missing required columns");
          setShowFireAlert(true);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setShowFireAlert(true);
      }
    };
    
    reader.readAsText(file);
  };

  // Auto-suggest exterior wall rating based on construction type and FSD
  React.useEffect(() => {
    const fsd = parseFloat(fireData.fireSeparationDistance);
    if (isNaN(fsd)) return;

    let rating = "0";
    
    // Simplified logic - actual app would use the full IBC table
    if (fsd < 5) {
      switch(constructionType) {
        case "ia": case "ib": rating = "2"; break;
        case "iia": case "iiia": case "iva": rating = "1"; break;
        default: rating = "1";
      }
    } else if (fsd < 10) {
      switch(constructionType) {
        case "ia": case "ib": case "iia": case "iiia": case "iva": rating = "1"; break;
        default: rating = "1";
      }
    }
    
    onFireDataChange("exteriorWallRating", rating);
  }, [fireData.fireSeparationDistance, constructionType]);

  // Auto-suggest opening protection based on FSD
  React.useEffect(() => {
    const fsd = parseFloat(fireData.fireSeparationDistance);
    if (isNaN(fsd)) return;

    let protection = "Not permitted";
    
    // Simplified logic - actual app would use the full IBC table
    if (fsd < 3) {
      protection = "Not permitted";
    } else if (fsd < 5) {
      protection = "15% max, protected";
    } else if (fsd < 10) {
      protection = "25% max, protected";
    } else if (fsd < 15) {
      protection = "45% max, protected";
    } else if (fsd < 20) {
      protection = "75% max, protected";
    } else {
      protection = "Unlimited, unprotected";
    }
    
    onFireDataChange("openingProtection", protection);
  }, [fireData.fireSeparationDistance]);

  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🔥</span> Fire Ratings & Summary
      </h2>
      
      {showFireAlert && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription>
            {requiredDatasets.fireRatings.prompt}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="fireSeparationDistance">Fire Separation Distance (ft)</Label>
                    <Input 
                      id="fireSeparationDistance"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Enter fire separation distance" 
                      value={fireData.fireSeparationDistance}
                      onChange={(e) => onFireDataChange("fireSeparationDistance", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC 602.1</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="exteriorWallRating">Wall Rating (hours)</Label>
                    <Input 
                      id="exteriorWallRating"
                      placeholder="Auto-calculated or enter manually" 
                      value={fireData.exteriorWallRating}
                      onChange={(e) => onFireDataChange("exteriorWallRating", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC Table 602</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="openingProtection">Opening Protection</Label>
                    <Input 
                      id="openingProtection"
                      placeholder="Auto-calculated or enter manually" 
                      value={fireData.openingProtection}
                      onChange={(e) => onFireDataChange("openingProtection", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC Table 705.8</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="shaftEnclosures">Shaft/Vertical Opening Ratings</Label>
                    <Input 
                      id="shaftEnclosures"
                      placeholder="Enter shaft enclosure ratings" 
                      value={fireData.shaftEnclosures}
                      onChange={(e) => onFireDataChange("shaftEnclosures", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>IBC 713.4</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="doorWindowRatings">Door and Window Ratings</Label>
            <Input 
              id="doorWindowRatings"
              placeholder="Enter door and window ratings" 
              value={fireData.doorWindowRatings}
              onChange={(e) => onFireDataChange("doorWindowRatings", e.target.value)}
            />
          </div>
        </div>
        
        <div className="pt-4">
          <div className="file-upload-area">
            <label htmlFor="fireRatingsCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Missing fire ratings data?</p>
                <p className="text-sm text-gray-500">Upload fire ratings CSV file</p>
              </div>
              <input
                id="fireRatingsCsvUpload"
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

export default FireRatingsStep;
