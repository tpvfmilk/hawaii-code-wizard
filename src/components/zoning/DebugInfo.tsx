
import React from "react";
import { Button } from "@/components/ui/button";

interface DebugInfoProps {
  showDebugInfo: boolean;
  debugInfo: any;
  setShowDebugInfo: (show: boolean) => void;
}

const DebugInfo = ({ showDebugInfo, debugInfo, setShowDebugInfo }: DebugInfoProps) => {
  if (!showDebugInfo || !debugInfo) return null;
  
  return (
    <div className="mb-4 overflow-auto bg-gray-50 p-3 rounded border">
      <h3 className="text-sm font-medium mb-2">CSV Debug Info:</h3>
      <div className="text-xs max-h-48 overflow-y-auto">
        <p className="font-semibold">Summary: {debugInfo.summary}</p>
        <p className="mt-1">First Row: "{debugInfo.firstRow}"</p>
        <p className="mt-1">Character Codes:</p>
        <pre className="bg-gray-100 p-1 mt-1">{JSON.stringify(debugInfo.charCodes)}</pre>
        <p className="mt-1">First Few Rows:</p>
        <pre className="bg-gray-100 p-1 mt-1">{JSON.stringify(debugInfo.firstFewRows, null, 2)}</pre>
      </div>
      <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowDebugInfo(false)}>
        Hide Debug Info
      </Button>
    </div>
  );
};

export default DebugInfo;
