
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  occupancyGroups, 
  constructionTypes, 
  requiredDatasets 
} from "@/data/codeData";
import { parseCSV, checkRequiredColumns } from "@/utils/CSVHelper";

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
  const [missingDataAlert, setMissingDataAlert] = useState({
    heightLimits: false,
    storyLimits: false,
    areaLimits: false
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
        const csvData = parseCSV(event.target?.result as string);
        const requiredColumns = requiredDatasets[datasetType as keyof typeof requiredDatasets].requiredColumns;
        
        if (checkRequiredColumns(csvData, requiredColumns)) {
          onDatasetUploaded(datasetType, csvData);
          setMissingDataAlert(prev => ({ ...prev, [datasetType]: false }));
        } else {
          console.error(`CSV for ${datasetType} missing required columns`);
          setMissingDataAlert(prev => ({ ...prev, [datasetType]: true }));
        }
      } catch (error) {
        console.error(`Error parsing ${datasetType} CSV:`, error);
        setMissingDataAlert(prev => ({ ...prev, [datasetType]: true }));
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🏢</span> Occupancy & Construction
      </h2>
      
      {(missingDataAlert.heightLimits || missingDataAlert.storyLimits || missingDataAlert.areaLimits) && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertDescription>
            {missingDataAlert.heightLimits && requiredDatasets.heightLimits.prompt}
            {missingDataAlert.storyLimits && <br />}
            {missingDataAlert.storyLimits && requiredDatasets.storyLimits.prompt}
            {missingDataAlert.areaLimits && <br />}
            {missingDataAlert.areaLimits && requiredDatasets.areaLimits.prompt}
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
              <Label htmlFor="stories">Number of Stories</Label>
              <Input 
                id="stories"
                type="number"
                min="1"
                placeholder="Enter stories" 
                value={occupancyData.stories}
                onChange={(e) => onOccupancyDataChange("stories", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buildingHeight">Total Building Height (ft)</Label>
              <Input 
                id="buildingHeight"
                type="number"
                min="0"
                placeholder="Enter height in feet" 
                value={occupancyData.buildingHeight}
                onChange={(e) => onOccupancyDataChange("buildingHeight", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="buildingArea">Total Building Area (SF)</Label>
              <Input 
                id="buildingArea"
                type="number"
                min="0"
                placeholder="Enter area in square feet" 
                value={occupancyData.buildingArea}
                onChange={(e) => onOccupancyDataChange("buildingArea", e.target.value)}
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
