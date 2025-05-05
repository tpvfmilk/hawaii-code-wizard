
import React from "react";
import { Button } from "@/components/ui/button";

interface DatasetPreviewProps {
  showPreview: boolean;
  previewData: any[];
  setShowPreview: (show: boolean) => void;
}

const DatasetPreview = ({ showPreview, previewData, setShowPreview }: DatasetPreviewProps) => {
  if (!showPreview || previewData.length === 0) return null;
  
  return (
    <div className="mb-4 overflow-auto">
      <h3 className="text-sm font-medium mb-2">Dataset Preview (first 3 rows):</h3>
      <div className="text-xs bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
        <pre>{JSON.stringify(previewData, null, 2)}</pre>
      </div>
      <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowPreview(false)}>
        Hide Preview
      </Button>
    </div>
  );
};

export default DatasetPreview;
