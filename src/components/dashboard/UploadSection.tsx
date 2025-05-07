
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X } from "lucide-react";
import { DatasetMap, DatasetKey } from "@/types/dashboard";

interface UploadSectionProps {
  datasets: DatasetMap;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, datasetKey: DatasetKey) => void;
  zoningInputRef: React.RefObject<HTMLInputElement>;
  parkingInputRef: React.RefObject<HTMLInputElement>;
  adaInputRef: React.RefObject<HTMLInputElement>;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  datasets,
  onFileUpload,
  zoningInputRef,
  parkingInputRef,
  adaInputRef
}) => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Zoning Standards Upload */}
      <div className="space-y-2">
        <Label htmlFor="zoning-upload">Zoning Standards</Label>
        <div className="flex gap-2">
          <Input 
            id="zoning-upload" 
            ref={zoningInputRef}
            type="file" 
            accept=".csv"
            onChange={(e) => onFileUpload(e, 'zoning')}
          />
          {datasets.zoning.status === 'loaded' && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
            </Badge>
          )}
          {datasets.zoning.status === 'missing' && (
            <Badge variant="destructive">
              <X className="w-3 h-3 mr-1" /> Missing
            </Badge>
          )}
          {datasets.zoning.status === 'uploading' && (
            <Badge variant="outline">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
              Uploading
            </Badge>
          )}
        </div>
      </div>
      
      {/* Parking Requirements Upload */}
      <div className="space-y-2">
        <Label htmlFor="parking-upload">Parking Requirements</Label>
        <div className="flex gap-2">
          <Input 
            id="parking-upload" 
            ref={parkingInputRef}
            type="file" 
            accept=".csv"
            onChange={(e) => onFileUpload(e, 'parking')}
          />
          {datasets.parking.status === 'loaded' && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
            </Badge>
          )}
          {datasets.parking.status === 'missing' && (
            <Badge variant="destructive">
              <X className="w-3 h-3 mr-1" /> Missing
            </Badge>
          )}
          {datasets.parking.status === 'uploading' && (
            <Badge variant="outline">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
              Uploading
            </Badge>
          )}
        </div>
      </div>
      
      {/* ADA Requirements Upload */}
      <div className="space-y-2">
        <Label htmlFor="ada-upload">ADA Requirements</Label>
        <div className="flex gap-2">
          <Input 
            id="ada-upload" 
            ref={adaInputRef}
            type="file" 
            accept=".csv"
            onChange={(e) => onFileUpload(e, 'ada')}
          />
          {datasets.ada.status === 'loaded' && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
            </Badge>
          )}
          {datasets.ada.status === 'missing' && (
            <Badge variant="destructive">
              <X className="w-3 h-3 mr-1" /> Missing
            </Badge>
          )}
          {datasets.ada.status === 'uploading' && (
            <Badge variant="outline">
              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
              Uploading
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
