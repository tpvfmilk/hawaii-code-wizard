import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { zoningDistricts, requiredDatasets } from "@/data/codeData";
import { parseCSV, checkRequiredColumns, findZoningMatch, validateDatasetStructure, calculateADAParking, debugCSVContent } from "@/utils/CSVHelper";
import { useToast } from "@/hooks/use-toast";
import { normalizeCSVColumns, logColumnTransformation, supabase } from "@/integrations/supabase/client";
import { Loader2, Check, AlertCircle } from "lucide-react";

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
  const {
    toast
  } = useToast();
  const [showZoningAlert, setShowZoningAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  }>({
    type: 'warning',
    message: ''
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [adaDataset, setAdaDataset] = useState<any[]>([]);
  const [zoningDataset, setZoningDataset] = useState<any[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingZoningData, setLoadingZoningData] = useState(true);
  const [populatedFields, setPopulatedFields] = useState<string[]>([]);
  const [populationAttempted, setPopulationAttempted] = useState(false);
  const [lastPopulationSuccess, setLastPopulationSuccess] = useState(false);
  
  const filteredDistricts = zoningDistricts.filter(district => district.jurisdiction === jurisdiction);

  // Fetch zoning data from Supabase when component mounts
  useEffect(() => {
    const fetchZoningData = async () => {
      try {
        setLoadingZoningData(true);
        const { data, error } = await supabase
          .from('zoning_standards')
          .select('*')
          .eq('county', jurisdiction);
        
        if (error) {
          console.error("Error fetching zoning data:", error);
          setValidationMessage({
            type: 'error',
            message: `Failed to fetch zoning data: ${error.message}`
          });
          return;
        }
        
        if (data && data.length > 0) {
          console.log("Fetched zoning standards from database:", data);
          setZoningDataset(data);
          onDatasetUploaded("zoning", data);
          
          toast({
            title: "Zoning Data Loaded",
            description: `${data.length} zoning standards loaded for ${jurisdiction}`
          });
        } else {
          setValidationMessage({
            type: 'warning',
            message: `No zoning data available for ${jurisdiction}. You'll need to manually fill in the fields or upload zoning data.`
          });
        }
      } catch (err) {
        console.error("Failed to fetch zoning data:", err);
        setValidationMessage({
          type: 'error',
          message: `Failed to fetch zoning data: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      } finally {
        setLoadingZoningData(false);
      }
    };
    
    // Fetch ADA requirements
    const fetchADAData = async () => {
      try {
        const { data, error } = await supabase
          .from('ada_requirements')
          .select('*');
        
        if (error) {
          console.error("Error fetching ADA data:", error);
          return;
        }
        
        if (data && data.length > 0) {
          setAdaDataset(data);
          onDatasetUploaded("ada", data);
          
          // If parking is already specified, calculate ADA requirement
          if (zoningData.parkingRequired) {
            const totalParking = parseInt(zoningData.parkingRequired);
            const adaResult = calculateADAParking(data, totalParking);
            onZoningDataChange("adaParking", adaResult.required.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch ADA data:", err);
      }
    };
    
    if (jurisdiction) {
      fetchZoningData();
      fetchADAData();
    }
  }, [jurisdiction]);

  // Auto-populate fields when zoning district changes
  useEffect(() => {
    if (zoningData.zoningDistrict && jurisdiction && zoningDataset.length > 0) {
      populateZoningFields();
    }
  }, [zoningData.zoningDistrict, jurisdiction, zoningDataset]);
  
  // Function to populate zoning fields based on selected district
  const populateZoningFields = () => {
    setIsLoading(true);
    setPopulationAttempted(true);
    
    // Reset populated fields
    setPopulatedFields([]);
    
    const newPopulatedFields: string[] = [];
    
    const match = findZoningMatch(zoningDataset, jurisdiction, zoningData.zoningDistrict);
    if (match) {
      // Auto-fill fields from the dataset
      if (match.front_setback && match.side_setback && match.rear_setback) {
        onZoningDataChange('setbacks', `${match.front_setback},${match.side_setback},${match.rear_setback}`);
        newPopulatedFields.push('setbacks');
      }
      if (match.max_far) {
        onZoningDataChange('far', match.max_far.toString());
        newPopulatedFields.push('far');
      }
      if (match.max_height) {
        onZoningDataChange('maxHeight', match.max_height.toString());
        newPopulatedFields.push('maxHeight');
      }
      if (match.max_lot_coverage) {
        onZoningDataChange('lotCoverage', match.max_lot_coverage.toString());
        newPopulatedFields.push('lotCoverage');
      }
      if (match.parking_required) {
        onZoningDataChange('parkingRequired', match.parking_required.toString());
        newPopulatedFields.push('parkingRequired');
        
        // Also update ADA parking if adaDataset is available
        if (adaDataset.length > 0) {
          const totalParking = parseInt(match.parking_required);
          const adaResult = calculateADAParking(adaDataset, totalParking);
          onZoningDataChange("adaParking", adaResult.required.toString());
          newPopulatedFields.push('adaParking');
        }
      }

      // Set the populated fields for highlighting
      setPopulatedFields(newPopulatedFields);
      setLastPopulationSuccess(true);

      // Show success message
      setValidationMessage({
        type: 'success',
        message: `Zoning data for ${match.zoning_district || match.district} auto-populated successfully! ${newPopulatedFields.length} fields updated.`
      });

      // Hide message after 5 seconds
      setTimeout(() => {
        setValidationMessage({
          type: 'warning',
          message: ''
        });
      }, 5000);
    } else {
      setLastPopulationSuccess(false);
      setValidationMessage({
        type: 'warning',
        message: `No matching zoning standards found for selected district "${zoningData.zoningDistrict}" in ${jurisdiction}. Please fill in the fields manually or upload zoning data.`
      });
      
      setTimeout(() => {
        setValidationMessage({
          type: 'warning',
          message: ''
        });
      }, 5000);
    }
    
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
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
        const {
          data
        } = result;
        if (!data || data.length === 0) {
          throw new Error("No data found in CSV file");
        }
        setPreviewData(data.slice(0, 3)); // Store first 3 rows for preview

        // Normalize CSV column names to match database schema
        const normalizedData = normalizeCSVColumns(data, "zoning");

        // Log transformation for debugging
        logColumnTransformation(data, normalizedData);

        // Validate dataset structure with normalized data
        const validation = validateDatasetStructure(normalizedData, "zoning");
        if (validation.valid) {
          onDatasetUploaded("zoning", normalizedData);
          setZoningDataset(normalizedData);
          setShowZoningAlert(false);
          setValidationMessage({
            type: 'success',
            message: `Successfully uploaded ${data.length} zoning records.`
          });
          toast({
            title: "Dataset Uploaded",
            description: `Successfully uploaded ${data.length} zoning records.`
          });

          // Show preview
          setShowPreview(true);

          // Try to auto-populate if district already selected
          if (zoningData.zoningDistrict && jurisdiction) {
            populateZoningFields();
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
            variant: "destructive"
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
          variant: "destructive"
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
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read file");
        }
        const fileContent = event.target.result as string;

        // Create debug information
        const debug = debugCSVContent(fileContent);
        console.log("ADA CSV Upload: Debug info", debug);
        setDebugInfo(debug); // Store debug info in case of errors

        const result = parseCSV(fileContent);
        const {
          data
        } = result;
        if (!data || data.length === 0) {
          throw new Error("No data found in CSV file");
        }
        console.log("ADA CSV Upload: Original data first row", data[0]);

        // Normalize CSV column names to match database schema
        const normalizedData = normalizeCSVColumns(data, "ada");

        // Log transformation for debugging
        logColumnTransformation(data, normalizedData);
        console.log("ADA CSV Upload: Normalized data first row", normalizedData[0]);

        // Validate dataset structure with normalized data
        const validation = validateDatasetStructure(normalizedData, "ada");
        if (validation.valid) {
          onDatasetUploaded("ada", normalizedData);
          setAdaDataset(normalizedData);
          setValidationMessage({
            type: 'success',
            message: `Successfully uploaded ${data.length} ADA parking requirement records.`
          });
          setShowPreview(true);
          setPreviewData(data.slice(0, 3)); // Show a preview of the data

          toast({
            title: "Dataset Uploaded",
            description: `Successfully uploaded ${data.length} ADA parking requirement records.`
          });

          // Recalculate ADA parking if parking required is set
          if (zoningData.parkingRequired) {
            const totalParking = parseInt(zoningData.parkingRequired);
            const adaResult = calculateADAParking(normalizedData, totalParking);
            onZoningDataChange("adaParking", adaResult.required.toString());
          }
        } else {
          setValidationMessage({
            type: 'error',
            message: validation.message
          });

          // Show debug info since there was an error
          setShowDebugInfo(true);
          toast({
            title: "Validation Error",
            description: validation.message,
            variant: "destructive"
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

        // Show debug info since there was an error
        setShowDebugInfo(true);
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive"
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
        variant: "destructive"
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
  
  // Helper function to determine if a field was recently populated
  const isFieldPopulated = (fieldName: string) => {
    return populatedFields.includes(fieldName);
  };
  
  return <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🏞️</span> Zoning & Site Info
      </h2>
      
      {showZoningAlert && <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle>CSV Format Guideline</AlertTitle>
          <AlertDescription>
            {requiredDatasets.zoning.prompt}
            <div className="text-xs mt-2">
              <p><strong>Required column names:</strong> county, zoning_district, front_setback, side_setback, rear_setback, max_far, max_height, max_lot_coverage, parking_required, ada_stalls_required</p>
            </div>
          </AlertDescription>
        </Alert>}
      
      {validationMessage.message && <Alert className={`mb-4 ${validationMessage.type === 'success' ? 'bg-green-50 border-green-200' : validationMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          {validationMessage.type === 'success' && <Check className="h-4 w-4 text-green-500 mr-2" />}
          {validationMessage.type === 'error' && <AlertCircle className="h-4 w-4 text-red-500 mr-2" />}
          <AlertDescription className="flex items-center">
            {validationMessage.message}
          </AlertDescription>
        </Alert>}
      
      {showPreview && previewData.length > 0 && <div className="mb-4 overflow-auto">
          <h3 className="text-sm font-medium mb-2">Dataset Preview (first 3 rows):</h3>
          <div className="text-xs bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
            <pre>{JSON.stringify(previewData, null, 2)}</pre>
          </div>
          <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowPreview(false)}>
            Hide Preview
          </Button>
        </div>}
      
      {showDebugInfo && debugInfo && <div className="mb-4 overflow-auto bg-gray-50 p-3 rounded border">
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
        </div>}
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zoningDistrict">Zoning</Label>
            <div className="relative">
              <Select 
                value={zoningData.zoningDistrict} 
                onValueChange={value => onZoningDataChange("zoningDistrict", value)}
                disabled={loadingZoningData}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingZoningData ? "Loading zoning data..." : "Select zoning district"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.map(district => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingZoningData && (
                <div className="absolute right-10 top-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {!loadingZoningData && zoningDataset.length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className={`mt-2 ${populationAttempted && lastPopulationSuccess ? 'bg-green-50 border-green-300 hover:bg-green-100' : populationAttempted ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' : ''}`}
                onClick={populateZoningFields}
                disabled={!zoningData.zoningDistrict || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : populationAttempted && lastPopulationSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Applied Successfully
                  </>
                ) : (
                  'Apply Zoning Standards'
                )}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lotArea">Lot Area (SF)</Label>
            <Input id="lotArea" type="number" placeholder="Enter lot area in square feet" value={zoningData.lotArea} onChange={e => onZoningDataChange("lotArea", e.target.value)} />
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
                      onChange={e => onZoningDataChange("setbacks", e.target.value)} 
                      className={isFieldPopulated("setbacks") ? "border-green-400 bg-green-50 transition-all duration-300" : ""}
                    />
                    {isFieldPopulated("setbacks") && (
                      <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
                    )}
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
                      onChange={e => onZoningDataChange("far", e.target.value)}
                      className={isFieldPopulated("far") ? "border-green-400 bg-green-50 transition-all duration-300" : ""} 
                    />
                    {isFieldPopulated("far") && (
                      <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
                    )}
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
              onChange={e => onZoningDataChange("maxHeight", e.target.value)} 
              className={isFieldPopulated("maxHeight") ? "border-green-400 bg-green-50 transition-all duration-300" : ""}
            />
            {isFieldPopulated("maxHeight") && (
              <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
            )}
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
              onChange={e => onZoningDataChange("lotCoverage", e.target.value)} 
              className={isFieldPopulated("lotCoverage") ? "border-green-400 bg-green-50 transition-all duration-300" : ""}
            />
            {isFieldPopulated("lotCoverage") && (
              <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
            )}
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
              onChange={e => onZoningDataChange("parkingRequired", e.target.value)} 
              className={isFieldPopulated("parkingRequired") ? "border-green-400 bg-green-50 transition-all duration-300" : ""}
            />
            {isFieldPopulated("parkingRequired") && (
              <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
            )}
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
                  className={`bg-gray-50 ${isFieldPopulated("adaParking") ? "border-green-400 bg-green-50" : ""}`} 
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically calculated based on total parking spaces</p>
              </TooltipContent>
            </Tooltip>
            {isFieldPopulated("adaParking") && (
              <p className="text-xs text-green-600 mt-1">Auto-calculated based on parking requirements</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="isSMA" checked={zoningData.isSMA} onCheckedChange={checked => onZoningDataChange("isSMA", Boolean(checked))} />
            <Label htmlFor="isSMA">SMA</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="isFloodZone" checked={zoningData.isFloodZone} onCheckedChange={checked => onZoningDataChange("isFloodZone", Boolean(checked))} />
            <Label htmlFor="isFloodZone">Flood Zone</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="isLavaZone" checked={zoningData.isLavaZone} onCheckedChange={checked => onZoningDataChange("isLavaZone", Boolean(checked))} />
            <Label htmlFor="isLavaZone">Lava Zone</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="isHistoricDistrict" checked={zoningData.isHistoricDistrict} onCheckedChange={checked => onZoningDataChange("isHistoricDistrict", Boolean(checked))} />
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
              <input id="zoningCsvUpload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
            <label htmlFor="adaCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Upload ADA requirements</p>
                <p className="text-sm text-gray-500">Upload ADA_Stall_Requirements.csv</p>
              </div>
              <input id="adaCsvUpload" type="file" accept=".csv" className="hidden" onChange={handleADAFileUpload} />
            </label>
          </div>
        </div>
      </div>
    </div>;
};
export default ZoningInfoStep;
