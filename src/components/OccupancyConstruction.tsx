
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  occupancyGroups, 
  constructionTypes, 
  requiredDatasets 
} from "@/data/codeData";
import { 
  parseCSV, 
  validateDatasetStructure,
  lookupBuildingHeight 
} from "@/utils/CSVHelper";
import { Badge } from "@/components/ui/badge";

interface OccupancyConstructionProps {
  occupancyData: {
    primaryOccupancy: string;
    secondaryOccupancies: string[];
    mixedOccupancyType: string;
    constructionType: string;
    stories: string;
    buildingHeight: string;
    buildingArea: string;
    sprinklered: boolean;
  };
  onOccupancyDataChange: (field: string, value: any) => void;
  onDatasetUploaded: (datasetType: string, data: any[]) => void;
}

const OccupancyConstruction = ({ 
  occupancyData, 
  onOccupancyDataChange,
  onDatasetUploaded
}: OccupancyConstructionProps) => {
  const [validationMessage, setValidationMessage] = useState<{type: 'success' | 'error' | 'warning'; message: string}>({
    type: 'warning',
    message: ''
  });
  const [heightLimitsData, setHeightLimitsData] = useState<any[]>([]);
  const [storyLimitsData, setStoryLimitsData] = useState<any[]>([]);
  const [areaLimitsData, setAreaLimitsData] = useState<any[]>([]);
  const [codeViolations, setCodeViolations] = useState<{
    height: boolean;
    stories: boolean;
    area: boolean;
  }>({
    height: false,
    stories: false,
    area: false
  });
  const [codeLimits, setCodeLimits] = useState<{
    height: { limit: number; description: string };
    stories: { limit: number; description: string };
    area: { limit: number; description: string };
  }>({
    height: { limit: 0, description: "No height data available" },
    stories: { limit: 0, description: "No story data available" },
    area: { limit: 0, description: "No area data available" }
  });

  const handleSecondaryOccupancyChange = (occupancyId: string) => {
    const currentSelection = [...occupancyData.secondaryOccupancies];
    
    if (currentSelection.includes(occupancyId)) {
      onOccupancyDataChange(
        "secondaryOccupancies",
        currentSelection.filter(id => id !== occupancyId)
      );
    } else {
      onOccupancyDataChange(
        "secondaryOccupancies",
        [...currentSelection, occupancyId]
      );
    }
  };

  const handleFileUpload = (datasetType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = parseCSV(event.target?.result as string);
        const { data } = result;
        
        // Validate dataset structure
        const validation = validateDatasetStructure(data, datasetType);
        
        if (validation.valid) {
          onDatasetUploaded(datasetType, data);
          
          // Store the dataset in local state based on type
          if (datasetType === "heightLimits") {
            setHeightLimitsData(data);
          } else if (datasetType === "storyLimits") {
            setStoryLimitsData(data);
          } else if (datasetType === "areaLimits") {
            setAreaLimitsData(data);
          }
          
          setValidationMessage({
            type: 'success',
            message: `Successfully uploaded ${data.length} records for ${datasetType}.`
          });
          
          // Clear message after 3 seconds
          setTimeout(() => {
            setValidationMessage({ type: 'warning', message: '' });
          }, 3000);
        } else {
          setValidationMessage({
            type: 'error',
            message: validation.message
          });
        }
      } catch (error) {
        console.error(`Error parsing ${datasetType} CSV:`, error);
        setValidationMessage({
          type: 'error',
          message: `Error parsing CSV: ${(error as Error).message}`
        });
      }
    };
    
    reader.readAsText(file);
  };
  
  // Update code limits whenever relevant data changes
  useEffect(() => {
    const checkCodeLimits = () => {
      // Only check if we have all necessary data
      if (occupancyData.primaryOccupancy && occupancyData.constructionType) {
        // Check height limits
        if (heightLimitsData.length > 0) {
          const heightLimit = lookupBuildingHeight(
            heightLimitsData,
            occupancyData.primaryOccupancy,
            occupancyData.constructionType,
            occupancyData.sprinklered
          );
          
          setCodeLimits(prev => ({
            ...prev,
            height: heightLimit
          }));
          
          // Check if entered height exceeds limit
          if (parseFloat(occupancyData.buildingHeight) > heightLimit.limit && heightLimit.limit > 0) {
            setCodeViolations(prev => ({
              ...prev,
              height: true
            }));
          } else {
            setCodeViolations(prev => ({
              ...prev,
              height: false
            }));
          }
        }
        
        // Similar checks for stories and area could be implemented here
      }
    };
    
    checkCodeLimits();
  }, [
    occupancyData.primaryOccupancy,
    occupancyData.constructionType,
    occupancyData.sprinklered,
    occupancyData.buildingHeight,
    occupancyData.stories,
    occupancyData.buildingArea,
    heightLimitsData,
    storyLimitsData,
    areaLimitsData
  ]);

  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🏢</span> Occupancy & Construction
      </h2>
      
      {validationMessage.message && (
        <Alert className={`mb-4 ${validationMessage.type === 'success' ? 'bg-green-50 border-green-200' : validationMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertDescription>
            {validationMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryOccupancy">Primary Occupancy Group</Label>
            <Select 
              value={occupancyData.primaryOccupancy} 
              onValueChange={(value) => onOccupancyDataChange("primaryOccupancy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary occupancy group" />
              </SelectTrigger>
              <SelectContent>
                {occupancyGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Secondary Occupancies (if applicable)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {occupancyGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`secondary-${group.id}`} 
                    checked={occupancyData.secondaryOccupancies.includes(group.id)}
                    disabled={group.id === occupancyData.primaryOccupancy}
                    onCheckedChange={() => handleSecondaryOccupancyChange(group.id)}
                  />
                  <Label htmlFor={`secondary-${group.id}`}>{group.name}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {occupancyData.secondaryOccupancies.length > 0 && (
            <div className="space-y-2">
              <Label>Mixed Occupancy Approach</Label>
              <RadioGroup
                value={occupancyData.mixedOccupancyType}
                onValueChange={(value) => onOccupancyDataChange("mixedOccupancyType", value)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="separated" id="separated" />
                  <Label htmlFor="separated">Separated</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-separated" id="non-separated" />
                  <Label htmlFor="non-separated">Non-separated</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="constructionType">Construction Type</Label>
            <Select 
              value={occupancyData.constructionType} 
              onValueChange={(value) => onOccupancyDataChange("constructionType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select construction type" />
              </SelectTrigger>
              <SelectContent>
                {constructionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="stories">Number of Stories</Label>
                {codeLimits.stories.limit > 0 && (
                  <span className="text-xs text-gray-500">
                    Max: {codeLimits.stories.limit}
                  </span>
                )}
              </div>
              <Input 
                id="stories"
                type="number"
                min="1"
                placeholder="Enter stories" 
                value={occupancyData.stories}
                onChange={(e) => onOccupancyDataChange("stories", e.target.value)}
                className={codeViolations.stories ? "border-red-500" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="buildingHeight">Building Height (ft)</Label>
                {codeLimits.height.limit > 0 && (
                  <span className="text-xs text-gray-500">
                    Max: {codeLimits.height.limit} ft
                  </span>
                )}
              </div>
              <Input 
                id="buildingHeight"
                type="number"
                min="0"
                placeholder="Enter height in feet" 
                value={occupancyData.buildingHeight}
                onChange={(e) => onOccupancyDataChange("buildingHeight", e.target.value)}
                className={codeViolations.height ? "border-red-500" : ""}
              />
              {codeViolations.height && (
                <p className="text-xs text-red-500 mt-1">
                  Exceeds maximum allowed height of {codeLimits.height.limit} ft
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="buildingArea">Building Area (SF)</Label>
                {codeLimits.area.limit > 0 && (
                  <span className="text-xs text-gray-500">
                    Max: {codeLimits.area.limit.toLocaleString()} SF
                  </span>
                )}
              </div>
              <Input 
                id="buildingArea"
                type="number"
                min="0"
                placeholder="Enter area in square feet" 
                value={occupancyData.buildingArea}
                onChange={(e) => onOccupancyDataChange("buildingArea", e.target.value)}
                className={codeViolations.area ? "border-red-500" : ""}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="sprinklered" 
              checked={occupancyData.sprinklered}
              onCheckedChange={(checked) => 
                onOccupancyDataChange("sprinklered", Boolean(checked))
              }
            />
            <Label htmlFor="sprinklered">Building is Sprinklered</Label>
          </div>
          
          {(occupancyData.primaryOccupancy && occupancyData.constructionType) && (
            <div className="bg-blue-50 p-3 rounded-md mt-2">
              <h4 className="text-sm font-medium mb-1">IBC Code Limits</h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Height Limit:</span> {codeLimits.height.description || 'Upload height limits data'}
                </p>
                <p>
                  <span className="font-medium">Story Limit:</span> {codeLimits.stories.description || 'Upload story limits data'}
                </p>
                <p>
                  <span className="font-medium">Area Limit:</span> {codeLimits.area.description || 'Upload area limits data'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="file-upload-area">
            <label htmlFor="heightLimitsCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Height Limits</p>
                <p className="text-xs text-gray-500">Upload Table 504.3 CSV</p>
              </div>
              <input
                id="heightLimitsCsvUpload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload("heightLimits")}
              />
            </label>
          </div>
          
          <div className="file-upload-area">
            <label htmlFor="storyLimitsCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Story Limits</p>
                <p className="text-xs text-gray-500">Upload Table 504.4 CSV</p>
              </div>
              <input
                id="storyLimitsCsvUpload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload("storyLimits")}
              />
            </label>
          </div>
          
          <div className="file-upload-area">
            <label htmlFor="areaLimitsCsvUpload" className="cursor-pointer">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Area Limits</p>
                <p className="text-xs text-gray-500">Upload Table 506.2 CSV</p>
              </div>
              <input
                id="areaLimitsCsvUpload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload("areaLimits")}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OccupancyConstruction;
