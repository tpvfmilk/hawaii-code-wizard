
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DebugInfoProps {
  debugInfo: any;
  showMapping?: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ debugInfo, showMapping = true }) => {
  return (
    <>
      {showMapping && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800 flex items-center gap-2">
            <Info className="w-4 h-4" />
            CSV Column Mapping Guidelines
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            <p className="mb-2">Your CSV file's column names must match these formats:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Zoning Standards:</strong>
                <ul className="list-disc ml-5">
                  <li>county</li>
                  <li>zoning_district</li>
                  <li>front_setback</li>
                  <li>side_setback</li>
                  <li>rear_setback</li>
                  <li>max_far</li>
                  <li>max_height</li>
                  <li>max_lot_coverage</li>
                </ul>
              </div>
              <div>
                <strong>Parking Requirements:</strong>
                <ul className="list-disc ml-5">
                  <li>county</li>
                  <li>use_type</li>
                  <li>parking_requirement</li>
                </ul>
              </div>
              <div>
                <strong>ADA Requirements:</strong>
                <ul className="list-disc ml-5">
                  <li>total_parking_spaces_provided</li>
                  <li>minimum_required_ada_stalls</li>
                </ul>
              </div>
            </div>
            <p className="mt-2 text-xs">Note: The app will try to normalize column names, but it's best to match these exactly.</p>
          </AlertDescription>
        </Alert>
      )}
      {debugInfo && (
        <div className="mt-6 bg-gray-50 border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">CSV Debug Information</h3>
          <div className="text-xs max-h-64 overflow-y-auto">
            <p className="font-medium">Summary: {debugInfo.summary}</p>
            <p className="mt-1">First Row:</p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{debugInfo.firstRow}</pre>
            
            <p className="mt-2">First Few Rows:</p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(debugInfo.firstFewRows, null, 2)}</pre>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugInfo;
