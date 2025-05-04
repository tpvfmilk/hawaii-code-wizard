
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { zoningDistricts, requiredDatasets, calculateADAParking } from "@/data/codeData";
import { parseCSV, checkRequiredColumns } from "@/utils/CSVHelper";

interface ZoningInfoStepProps {
  zoningData: {
    zoningDistrict: string;
    lotArea: string;
    setbacks: string;
    far: string;
    maxHeight: string;
    lotCoverage: string;
    parkingRequired: string;
    adaParking: string;
    isSMA: boolean;
    isFloodZone: boolean;
    isLavaZone: boolean;
    isHistoricDistrict: boolean;
  };
  onZoningDataChange: (field: string, value: string | boolean) => void;
  jurisdiction: string;
  onDatasetUploaded: (datasetType: string, data: any[]) => void;
}

const ZoningInfoStep = ({ 
  zoningData, 
  onZoningDataChange, 
  jurisdiction,
  onDatasetUploaded
}: ZoningInfoStepProps) => {
  const [showZoningAlert, setShowZoningAlert] = useState(false);
  const filteredDistricts = zoningDistricts.filter(
    district => district.jurisdiction === jurisdiction
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        
        if (checkRequiredColumns(csvData, requiredDatasets.zoning.requiredColumns)) {
          onDatasetUploaded("zoning", csvData);
          setShowZoningAlert(false);
        } else {
          console.error("CSV missing required columns");
          setShowZoningAlert(true);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setShowZoningAlert(true);
      }
    };
    
    reader.readAsText(file);
  };

  const calculateTotalParking = () => {
    const parking = parseFloat(zoningData.parkingRequired) || 0;
    return Math.ceil(parking);
  };

  const totalParking = calculateTotalParking();

  // Calculate ADA parking whenever total parking changes
  React.useEffect(() => {
    const adaRequired = calculateADAParking(totalParking);
    onZoningDataChange("adaParking", adaRequired.toString());
  }, [zoningData.parkingRequired]);

  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🏞️</span> Zoning & Site Info
      </h2>
      
      {showZoningAlert && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription>
            {requiredDatasets.zoning.prompt}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zoningDistrict">Zoning District</Label>
            <Select 
              value={zoningData.zoningDistrict} 
              onValueChange={(value) => onZoningDataChange("zoningDistrict", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select zoning district" />
              </SelectTrigger>
              <SelectContent>
                {filteredDistricts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lotArea">Lot Area (SF)</Label>
            <Input 
              id="lotArea" 
              type="number"
              placeholder="Enter lot area in square feet" 
              value={zoningData.lotArea}
              onChange={(e) => onZoningDataChange("lotArea", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="setbacks">Setbacks (ft)</Label>
                    <Input 
                      id="setbacks" 
                      placeholder="Front, Side, Rear (e.g. 10,5,10)" 
                      value={zoningData.setbacks}
                      onChange={(e) => onZoningDataChange("setbacks", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Format as Front,Side,Rear in feet</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="far">Floor Area Ratio (FAR)</Label>
                    <Input 
                      id="far"
                      type="number"
                      step="0.1" 
                      placeholder="Enter FAR" 
                      value={zoningData.far}
                      onChange={(e) => onZoningDataChange("far", e.target.value)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum Floor Area Ratio permitted</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxHeight">Max Height (ft)</Label>
            <Input 
              id="maxHeight"
              type="number" 
              placeholder="Enter maximum height" 
              value={zoningData.maxHeight}
              onChange={(e) => onZoningDataChange("maxHeight", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lotCoverage">Lot Coverage (%)</Label>
            <Input 
              id="lotCoverage"
              type="number"
              min="0"
              max="100" 
              placeholder="Enter lot coverage percentage" 
              value={zoningData.lotCoverage}
              onChange={(e) => onZoningDataChange("lotCoverage", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parkingRequired">Parking Required (spaces)</Label>
            <Input 
              id="parkingRequired"
              type="number"
              min="0" 
              placeholder="Enter required parking spaces" 
              value={zoningData.parkingRequired}
              onChange={(e) => onZoningDataChange("parkingRequired", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adaParking">ADA Parking Required</Label>
            <Input 
              id="adaParking"
              type="number"
              min="0"
              readOnly 
              value={zoningData.adaParking}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isSMA" 
              checked={zoningData.isSMA}
              onCheckedChange={(checked) => 
                onZoningDataChange("isSMA", Boolean(checked))
              }
            />
            <Label htmlFor="isSMA">SMA</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isFloodZone" 
              checked={zoningData.isFloodZone}
              onCheckedChange={(checked) => 
                onZoningDataChange("isFloodZone", Boolean(checked))
              }
            />
            <Label htmlFor="isFloodZone">Flood Zone</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isLavaZone" 
              checked={zoningData.isLavaZone}
              onCheckedChange={(checked) => 
                onZoningDataChange("isLavaZone", Boolean(checked))
              }
            />
            <Label htmlFor="isLavaZone">Lava Zone</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isHistoricDistrict" 
              checked={zoningData.isHistoricDistrict}
              onCheckedChange={(checked) => 
                onZoningDataChange("isHistoricDistrict", Boolean(checked))
              }
            />
            <Label htmlFor="isHistoricDistrict">Historic District</Label>
          </div>
        </div>
        
        <div className="pt-4">
          <div className="file-upload-area">
            <label htmlFor="zoningCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Missing zoning data?</p>
                <p className="text-sm text-gray-500">Upload zoning CSV file</p>
              </div>
              <input
                id="zoningCsvUpload"
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

export default ZoningInfoStep;
