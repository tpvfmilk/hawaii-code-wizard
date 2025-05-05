
import React from "react";
import { Button } from "@/components/ui/button";

interface MatchDetailsProps {
  showMatchDetails: boolean;
  attemptedMatch: string;
  zoningDataset: any[];
  jurisdiction: string;
  setShowMatchDetails: (show: boolean) => void;
}

const MatchDetails = ({ 
  showMatchDetails, 
  attemptedMatch, 
  zoningDataset,
  jurisdiction,
  setShowMatchDetails 
}: MatchDetailsProps) => {
  if (!showMatchDetails || !attemptedMatch) return null;
  
  return (
    <div className="mb-4 overflow-auto bg-gray-50 p-3 rounded border">
      <h3 className="text-sm font-medium mb-2">Matching Debug Info:</h3>
      <div className="text-xs max-h-48 overflow-y-auto">
        <p className="font-semibold">Attempted match for: {attemptedMatch}</p>
        <p className="mt-1">Available zoning records in dataset: {zoningDataset.length}</p>
        <p className="mt-1">Jurisdiction: {jurisdiction}</p>
        <p className="mt-1">First 3 zoning records:</p>
        <pre className="bg-gray-100 p-1 mt-1">
          {JSON.stringify(zoningDataset.slice(0, 3).map(z => ({
            jurisdiction: z.county,
            district: z.zoning_district,
          })), null, 2)}
        </pre>
      </div>
      <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowMatchDetails(false)}>
        Hide Match Debug Info
      </Button>
    </div>
  );
};

export default MatchDetails;
