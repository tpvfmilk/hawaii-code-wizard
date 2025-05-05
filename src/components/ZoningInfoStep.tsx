
import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zoningDistricts, requiredDatasets } from "@/data/codeData";
import { 
  parseCSV, 
  checkRequiredColumns, 
  findZoningMatch,
  validateDatasetStructure,
  calculateADAParking,
  debugCSVContent
} from "@/utils/CSVHelper";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [showZoningAlert, setShowZoningAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{type: 'success' | 'error' | 'warning'; message: string}>({ 
    type: 'warning', 
    message: '' 
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [adaDataset, setAdaDataset] = useState<any[]>([]);
  const [zoningDataset, setZoningDataset] = useState<any[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const filteredDistricts = zoningDistricts.filter(
    district => district.jurisdiction === jurisdiction
  );

  // Auto-populate fields when zoning district changes
  useEffect(() => {
    if (zoningData.zoningDistrict && jurisdiction && zoningDataset.length > 0) {
      const match = findZoningMatch(zoningDataset, jurisdiction, zoningData.zoningDistrict);
      
      if (match) {
        // Auto-fill fields from the dataset
        if (match.front_setback && match.side_setback && match.rear_setback) {
          onZoningDataChange('setbacks', `${match.front_setback},${match.side_setback},${match.rear_setback}`);
        }
        
        if (match.max_far) {
          onZoningDataChange('far', match.max_far.toString());
        }
        
        if (match.max_height) {
          onZoningDataChange('maxHeight', match.max_height.toString());
        }
        
        if (match.max_lot_coverage) {
          onZoningDataChange('lotCoverage', match.max_lot_coverage.toString());
        }
        
        // Show success message
        setValidationMessage({
          type: 'success',
          message: 'Zoning data auto-populated successfully!'
        });
        
        // Hide message after 3 seconds
        setTimeout(() => {
          setValidationMessage({ type: 'warning', message: '' });
        }, 3000);
      }
    }
  }, [zoningData.zoningDistrict, jurisdiction, zoningDataset]);

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
        
        // Create debug information first
        const debug = debugCSVContent(fileContent);
        setDebugInfo(debug);
        
        console.log("CSV Upload: Processing file", file.name);
        console.log("CSV Upload: File size", file.size, "bytes");
        console.log("CSV Upload: Debug info", debug);
        
        // Now try to parse
        const result = parseCSV(fileContent);
        const { data } = result;
        
        if (!data || data.length === 0) {
          throw new Error("No data found in CSV file");
        }
        
        setPreviewData(data.slice(0, 3)); // Store first 3 rows for preview
        
        // Validate dataset structure
        const validation = validateDatasetStructure(data, "zoning");
        
        if (validation.valid) {
          onDatasetUploaded("zoning", data);
          setZoningDataset(data);
          setShowZoningAlert(false);
          setValidationMessage({ 
            type: 'success', 
            message: `Successfully uploaded ${data.length} zoning records.` 
          });
          
          toast({
            title: "Dataset Uploaded",
            description: `Successfully uploaded ${data.length} zoning records.`,
          });
          
          // Show preview
          setShowPreview(true);
          
          // Try to auto-populate if district already selected
          if (zoningData.zoningDistrict && jurisdiction) {
            const match = findZoningMatch(data, jurisdiction, zoningData.zoningDistrict);
            if (match) {
              // Auto-fill fields from the dataset
              if (match.front_setback && match.side_setback && match.rear_setback) {
                onZoningDataChange('setbacks', `${match.front_setback},${match.side_setback},${match.rear_setback}`);
              }
              
              if (match.max_far) {
                onZoningDataChange('far', match.max_far.toString());
              }
              
              if (match.max_height) {
                onZoningDataChange('maxHeight', match.max_height.toString());
              }
              
              if (match.max_lot_coverage) {
                onZoningDataChange('lotCoverage', match.max_lot_coverage.toString());
              }
            }
          }
        } else {
          setShowZoningAlert(true);
          setValidationMessage({ 
            type: 'error', 
            message: validation.message 
          });
          
          toast({
            title: "Validation Error",
            description: validation.message,
            variant: "destructive",
          });
          
          console.error("CSV validation failed:", validation.message);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setShowZoningAlert(true);
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
  
  const handleADAFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.log("ADA CSV Upload: Debug info", debug);
        
        const result = parseCSV(fileContent);
        const { data } = result;
        
        if (!data || data.length === 0) {
          throw new Error("No data found in CSV file");
        }
        
        // Validate dataset structure
        const validation = validateDatasetStructure(data, "ada");
        
        if (validation.valid) {
          onDatasetUploaded("ada", data);
          setAdaDataset(data);
          setValidationMessage({ 
            type: 'success', 
            message: `Successfully uploaded ${data.length} ADA parking requirement records.` 
          });
          
          toast({
            title: "Dataset Uploaded",
            description: `Successfully uploaded ${data.length} ADA parking requirement records.`,
          });
          
          // Recalculate ADA parking if parking required is set
          if (zoningData.parkingRequired) {
            const totalParking = parseInt(zoningData.parkingRequired);
            const adaResult = calculateADAParking(data, totalParking);
            onZoningDataChange("adaParking", adaResult.required.toString());
          }
        } else {
          setValidationMessage({ 
            type: 'error', 
            message: validation.message 
          });
          
          toast({
            title: "Validation Error",
            description: validation.message,
            variant: "destructive",
          });
          
          console.error("CSV validation failed:", validation.message);
        }
      } catch (error) {
        console.error("Error parsing ADA CSV:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error parsing CSV file. Please check the format.';
        
        setValidationMessage({ 
          type: 'error', 
          message: errorMessage 
        });
        
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

  const calculateTotalParking = () => {
    const parking = parseFloat(zoningData.parkingRequired) || 0;
    return Math.ceil(parking);
  };

  const totalParking = calculateTotalParking();

  // Calculate ADA parking whenever total parking changes
  React.useEffect(() => {
    if (adaDataset.length > 0) {
      const adaResult = calculateADAParking(adaDataset, totalParking);
      onZoningDataChange("adaParking", adaResult.required.toString());
    } else {
      const adaRequired = calculateADAParking([], totalParking);
      onZoningDataChange("adaParking", adaRequired.required.toString());
    }
  }, [zoningData.parkingRequired, adaDataset]);

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
      
      {validationMessage.message && (
        <Alert className={`mb-4 ${validationMessage.type === 'success' ? 'bg-green-50 border-green-200' : validationMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertDescription>
            {validationMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      {showPreview && previewData.length > 0 && (
        <div className="mb-4 overflow-auto">
          <h3 className="text-sm font-medium mb-2">Dataset Preview (first 3 rows):</h3>
          <div className="text-xs bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
          </div>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowPreview(false)}>
            Hide Preview
          </Button>
        </div>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Input 
                  id="adaParking"
                  type="number"
                  min="0"
                  readOnly 
                  value={zoningData.adaParking}
                  className="bg-gray-50"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically calculated based on total parking spaces</p>
              </TooltipContent>
            </Tooltip>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
            <label htmlFor="zoningCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Upload zoning data</p>
                <p className="text-sm text-gray-500">Upload Zoning_Standards.csv</p>
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
          
          <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
            <label htmlFor="adaCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Upload ADA requirements</p>
                <p className="text-sm text-gray-500">Upload ADA_Stall_Requirements.csv</p>
              </div>
              <input
                id="adaCsvUpload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleADAFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZoningInfoStep;

