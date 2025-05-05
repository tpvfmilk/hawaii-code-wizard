
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface MatchDetailsProps {
  showMatchDetails: boolean;
  attemptedMatch: string;
  zoningDataset: any[];
  jurisdiction: string;
  setShowMatchDetails: (show: boolean) => void;
  debugInfo?: any;
}

const MatchDetails = ({ 
  showMatchDetails, 
  attemptedMatch, 
  zoningDataset,
  jurisdiction,
  setShowMatchDetails,
  debugInfo
}: MatchDetailsProps) => {
  if (!showMatchDetails || !attemptedMatch) return null;
  
  return (
    <div className="mb-4 overflow-auto bg-gray-50 p-3 rounded border">
      <h3 className="text-sm font-medium mb-2">Matching Debug Info:</h3>
      <div className="text-xs max-h-64 overflow-y-auto">
        <p className="font-semibold">Attempted match for: {attemptedMatch}</p>
        <p className="mt-1">Available zoning records in dataset: {zoningDataset.length}</p>
        <p className="mt-1">Jurisdiction: {jurisdiction}</p>
        
        {debugInfo ? (
          <>
            <Separator className="my-2" />
            <p className="font-semibold">Detailed Match Debug Info:</p>
            
            <div className="mt-1">
              <p className="font-medium">Jurisdiction Check:</p>
              <p>Frontend value: <Badge variant="outline">{debugInfo.jurisdictionCheck.frontendValue}</Badge></p>
              <p>Available in dataset: {debugInfo.jurisdictionCheck.datasetValues.map((v: string, i: number) => (
                <Badge key={i} variant={v === debugInfo.jurisdictionCheck.frontendValue ? "default" : "outline"} className="mr-1 mt-1">
                  {v}
                </Badge>
              ))}</p>
            </div>
            
            <div className="mt-2">
              <p className="font-medium">Zoning District Check:</p>
              <p>Frontend value: <Badge variant="outline">{debugInfo.districtCheck.frontendValue}</Badge></p>
              
              {debugInfo.districtCheck.exactMatches.length > 0 && (
                <div>
                  <p>Exact matches found:</p>
                  {debugInfo.districtCheck.exactMatches.map((match: string, i: number) => (
                    <Badge key={i} variant="default" className="mr-1 mt-1">{match}</Badge>
                  ))}
                </div>
              )}
              
              {debugInfo.districtCheck.partialMatches.length > 0 && (
                <div className="mt-1">
                  <p>Partial matches found:</p>
                  {debugInfo.districtCheck.partialMatches.map((match: string, i: number) => (
                    <Badge key={i} variant="secondary" className="mr-1 mt-1">{match}</Badge>
                  ))}
                </div>
              )}
              
              {debugInfo.matchAttempts.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">First 5 comparison attempts:</p>
                  <div className="bg-gray-100 p-1 rounded mt-1">
                    {debugInfo.matchAttempts.slice(0, 5).map((attempt: any, i: number) => (
                      <div key={i} className={`p-1 ${i % 2 === 0 ? 'bg-gray-200' : ''} text-[10px]`}>
                        <p>
                          <span className="font-medium">Record: </span>
                          <span>{attempt.record.county} / {attempt.record.district}</span>
                        </p>
                        <p>
                          <span className="font-medium">County: </span>
                          <span>{attempt.comparison.countyMatch ? '✅' : '❌'} {attempt.comparison.countyComparison}</span>
                        </p>
                        <p>
                          <span className="font-medium">District: </span>
                          <span>{attempt.comparison.districtMatch ? '✅' : '❌'} {attempt.comparison.districtComparison}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-amber-600">No detailed debug information available.</p>
            <p>First 3 zoning records:</p>
            <pre className="bg-gray-100 p-1 mt-1">
              {JSON.stringify(zoningDataset.slice(0, 3).map(z => ({
                jurisdiction: z.county,
                district: z.zoning_district,
              })), null, 2)}
            </pre>
          </div>
        )}
      </div>
      <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowMatchDetails(false)}>
        Hide Match Debug Info
      </Button>
    </div>
  );
};

export default MatchDetails;
