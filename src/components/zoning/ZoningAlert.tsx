
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { requiredDatasets } from "@/data/codeData";

interface ZoningAlertProps {
  show: boolean;
}

const ZoningAlert = ({ show }: ZoningAlertProps) => {
  if (!show) return null;
  
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertTitle>CSV Format Guideline</AlertTitle>
      <AlertDescription>
        {requiredDatasets.zoning.prompt}
        <div className="text-xs mt-2">
          <p><strong>Required column names:</strong> county, zoning_district, front_setback, side_setback, rear_setback, max_far, max_height, max_lot_coverage, parking_required, ada_stalls_required</p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ZoningAlert;
