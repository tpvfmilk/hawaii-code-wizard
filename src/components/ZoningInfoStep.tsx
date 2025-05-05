
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { zoningDistricts, requiredDatasets } from "@/data/codeData";
import { parseCSV, checkRequiredColumns, findZoningMatch, validateDatasetStructure, calculateADAParking, debugCSVContent } from "@/utils/CSVHelper";
import { useToast } from "@/hooks/use-toast";
import { normalizeCSVColumns, logColumnTransformation, supabase } from "@/integrations/supabase/client";

// Import our new components
import ZoningDistrictSelector from "./zoning/ZoningDistrictSelector";
import ValidationMessage from "./zoning/ValidationMessage";
import DatasetPreview from "./zoning/DatasetPreview";
import DebugInfo from "./zoning/DebugInfo";
import MatchDetails from "./zoning/MatchDetails";
import FileUpload from "./zoning/FileUpload";
import ZoningAlert from "./zoning/ZoningAlert";
import ZoningDataField from "./zoning/ZoningDataField";
import ZoningCheckbox from "./zoning/ZoningCheckbox";

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
  const [attemptedMatch, setAttemptedMatch] = useState<string>("");
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  
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
          
          // If zoning district is already selected, try to populate fields
          if (zoningData.zoningDistrict) {
            setTimeout(() => populateZoningFields(), 500);
          }
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
          console.log("Fetched ADA requirements from database:", data);
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
  
  // Check for auto-population opportunities when any field changes
  useEffect(() => {
    // Only check if we have zoning data and a district selected
    if (zoningData.zoningDistrict && zoningDataset.length > 0 && !isLoading) {
      const match = findZoningMatch(zoningDataset, jurisdiction, zoningData.zoningDistrict);
      if (match && !lastPopulationSuccess) {
        // Only show the auto-populate suggestion if we haven't successfully populated fields yet
        setValidationMessage({
          type: 'warning',
          message: 'Data match found! Click "Apply Zoning Standards" to auto-populate fields.'
        });
      }
    }
  }, [zoningData, zoningDataset]);
  
  // Function to populate zoning fields based on selected district
  const populateZoningFields = () => {
    setIsLoading(true);
    setPopulationAttempted(true);
    setAttemptedMatch(zoningData.zoningDistrict);
    
    // Reset populated fields
    setPopulatedFields([]);
    
    const newPopulatedFields: string[] = [];
    
    console.log("Attempting to find zoning match for:", zoningData.zoningDistrict);
    console.log("Jurisdiction:", jurisdiction);
    console.log("Available zoning data:", zoningDataset.length, "records");
    
    const match = findZoningMatch(zoningDataset, jurisdiction, zoningData.zoningDistrict);
    console.log("Match result:", match);
    
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
      toast({
        title: "Auto-Population Successful",
        description: `${newPopulatedFields.length} fields updated from zoning standards.`,
        variant: "default"
      });
      
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
      
      // Log available zoning districts for debugging
      console.log("Available zoning districts in dataset:");
      zoningDataset.forEach(item => {
        console.log(`- ${item.county}: ${item.zoning_district}`);
      });
      
      toast({
        title: "No Match Found",
        description: "Could not find matching zoning standards for the selected district.",
        variant: "destructive"
      });
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
            setTimeout(() => populateZoningFields(), 500);
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
  
  // Listen for field changes to check if auto-population should occur
  const handleFieldChange = (field: string, value: string | boolean) => {
    // Call the parent handler first
    onZoningDataChange(field, value);
    
    // If we already had a successful auto-population, no need to suggest again
    if (lastPopulationSuccess) return;
    
    // After manual field change, check if auto-population is available
    if (field === "zoningDistrict" && zoningDataset.length > 0) {
      // We'll show a message if there's a possible match
      const match = findZoningMatch(zoningDataset, jurisdiction, value.toString());
      if (match) {
        setValidationMessage({
          type: 'warning',
          message: 'Data match found! Click "Apply Zoning Standards" to auto-populate fields.'
        });
      }
    }
  };
  
  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🏞️</span> Zoning & Site Info
      </h2>
      
      <ZoningAlert show={showZoningAlert} />
      
      <ValidationMessage 
        type={validationMessage.type} 
        message={validationMessage.message} 
      />
      
      <DatasetPreview 
        showPreview={showPreview} 
        previewData={previewData} 
        setShowPreview={setShowPreview} 
      />
      
      <DebugInfo 
        showDebugInfo={showDebugInfo} 
        debugInfo={debugInfo} 
        setShowDebugInfo={setShowDebugInfo} 
      />
      
      <MatchDetails 
        showMatchDetails={showMatchDetails} 
        attemptedMatch={attemptedMatch} 
        zoningDataset={zoningDataset}
        jurisdiction={jurisdiction}
        setShowMatchDetails={setShowMatchDetails} 
      />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zoningDistrict">Zoning</Label>
            <ZoningDistrictSelector
              zoningDistrict={zoningData.zoningDistrict}
              onChange={(value) => handleFieldChange("zoningDistrict", value)}
              districts={filteredDistricts}
              onApplyStandards={populateZoningFields}
              isLoading={isLoading}
              loadingZoningData={loadingZoningData}
              populationAttempted={populationAttempted}
              lastPopulationSuccess={lastPopulationSuccess}
              showMatchDetails={showMatchDetails}
              setShowMatchDetails={setShowMatchDetails}
            />
          </div>
          
          <ZoningDataField 
            id="lotArea"
            label="Lot Area (SF)"
            type="number"
            placeholder="Enter lot area in square feet"
            value={zoningData.lotArea}
            onChange={(value) => handleFieldChange("lotArea", value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ZoningDataField 
            id="setbacks"
            label="Setbacks (ft)"
            placeholder="Front, Side, Rear (e.g. 10,5,10)"
            value={zoningData.setbacks}
            onChange={(value) => handleFieldChange("setbacks", value)}
            isPopulated={isFieldPopulated("setbacks")}
            tooltip="Format as Front,Side,Rear in feet"
          />
          
          <ZoningDataField 
            id="far"
            label="Floor Area Ratio (FAR)"
            type="number"
            step="0.1"
            placeholder="Enter FAR"
            value={zoningData.far}
            onChange={(value) => handleFieldChange("far", value)}
            isPopulated={isFieldPopulated("far")}
            tooltip="Maximum Floor Area Ratio permitted"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ZoningDataField 
            id="maxHeight"
            label="Max Height (ft)"
            type="number"
            placeholder="Enter maximum height"
            value={zoningData.maxHeight}
            onChange={(value) => handleFieldChange("maxHeight", value)}
            isPopulated={isFieldPopulated("maxHeight")}
          />
          
          <ZoningDataField 
            id="lotCoverage"
            label="Lot Coverage (%)"
            type="number"
            min="0"
            max="100"
            placeholder="Enter lot coverage percentage"
            value={zoningData.lotCoverage}
            onChange={(value) => handleFieldChange("lotCoverage", value)}
            isPopulated={isFieldPopulated("lotCoverage")}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ZoningDataField 
            id="parkingRequired"
            label="Parking Required (spaces)"
            type="number"
            min="0"
            placeholder="Enter required parking spaces"
            value={zoningData.parkingRequired}
            onChange={(value) => handleFieldChange("parkingRequired", value)}
            isPopulated={isFieldPopulated("parkingRequired")}
          />
          
          <ZoningDataField 
            id="adaParking"
            label="ADA Parking Required"
            type="number"
            min="0"
            readOnly={true}
            value={zoningData.adaParking}
            onChange={(value) => handleFieldChange("adaParking", value)}
            isPopulated={isFieldPopulated("adaParking")}
            tooltip="Automatically calculated based on total parking spaces"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <ZoningCheckbox 
            id="isSMA"
            label="SMA"
            checked={zoningData.isSMA}
            onCheckedChange={(checked) => handleFieldChange("isSMA", checked)}
          />
          
          <ZoningCheckbox 
            id="isFloodZone"
            label="Flood Zone"
            checked={zoningData.isFloodZone}
            onCheckedChange={(checked) => handleFieldChange("isFloodZone", checked)}
          />
          
          <ZoningCheckbox 
            id="isLavaZone"
            label="Lava Zone"
            checked={zoningData.isLavaZone}
            onCheckedChange={(checked) => handleFieldChange("isLavaZone", checked)}
          />
          
          <ZoningCheckbox 
            id="isHistoricDistrict"
            label="Historic District"
            checked={zoningData.isHistoricDistrict}
            onCheckedChange={(checked) => handleFieldChange("isHistoricDistrict", checked)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <FileUpload 
            id="zoningCsvUpload"
            title="Upload zoning data"
            description="Upload Zoning_Standards.csv"
            onChange={handleFileUpload}
          />
          
          <FileUpload 
            id="adaCsvUpload"
            title="Upload ADA requirements"
            description="Upload ADA_Stall_Requirements.csv"
            onChange={handleADAFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default ZoningInfoStep;
