
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatasetKey } from "@/types/dashboard";

interface DatasetNotesProps {
  datasetKey: DatasetKey;
  notes: string;
  onNotesChange: (datasetKey: DatasetKey, notes: string) => void;
}

const DatasetNotes: React.FC<DatasetNotesProps> = ({
  datasetKey,
  notes,
  onNotesChange
}) => {
  return (
    <div className="mt-6">
      <Label htmlFor={`${datasetKey}-notes`}>Notes</Label>
      <Textarea
        id={`${datasetKey}-notes`}
        placeholder="Add notes about this dataset..."
        value={notes}
        onChange={(e) => onNotesChange(datasetKey, e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
};

export default DatasetNotes;
