
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import { DatasetKey, DatasetMap } from "@/types/dashboard";

interface DatasetControlsProps {
  datasetKey: DatasetKey;
  dataset: DatasetMap[DatasetKey];
  onAddRow: () => void;
  onSaveChanges: () => void;
  onDownloadCSV: () => void;
}

const DatasetControls: React.FC<DatasetControlsProps> = ({
  datasetKey,
  dataset,
  onAddRow,
  onSaveChanges,
  onDownloadCSV
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{dataset.name}</h3>
        {dataset.lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(dataset.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onAddRow} size="sm" className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Row
        </Button>
        <Button onClick={onSaveChanges} size="sm" className="flex items-center gap-1">
          <Upload className="w-4 h-4" /> Save Changes
        </Button>
        <Button 
          onClick={onDownloadCSV} 
          variant="outline" 
          size="sm"
          disabled={!dataset.data}
          className="flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Download CSV
        </Button>
      </div>
    </div>
  );
};

export default DatasetControls;
