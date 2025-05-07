
import React from 'react';
import { Alert, AlertCircle, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DatasetMap } from "@/types/dashboard";

interface MissingFilesWarningProps {
  datasets: DatasetMap;
}

const MissingFilesWarning: React.FC<MissingFilesWarningProps> = ({ datasets }) => {
  const hasMissingFiles = (
    datasets.zoning.status === 'missing' || 
    datasets.parking.status === 'missing' || 
    datasets.ada.status === 'missing'
  );

  if (!hasMissingFiles) return null;

  return (
    <Alert variant="destructive" className="mt-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Required Files</AlertTitle>
      <AlertDescription>
        Some required data files are missing. The wizard may not function correctly until all files are uploaded.
      </AlertDescription>
    </Alert>
  );
};

export default MissingFilesWarning;
