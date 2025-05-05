
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Check, RefreshCw, Bug } from "lucide-react";
import { ZoningDistrict } from "@/data/codeData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ZoningDistrictSelectorProps {
  zoningDistrict: string;
  onChange: (value: string) => void;
  districts: ZoningDistrict[];
  onApplyStandards: () => void;
  isLoading: boolean;
  loadingZoningData: boolean;
  populationAttempted: boolean;
  lastPopulationSuccess: boolean;
  showMatchDetails: boolean;
  setShowMatchDetails: (show: boolean) => void;
}

const ZoningDistrictSelector = ({
  zoningDistrict,
  onChange,
  districts,
  onApplyStandards,
  isLoading,
  loadingZoningData,
  populationAttempted,
  lastPopulationSuccess,
  showMatchDetails,
  setShowMatchDetails
}: ZoningDistrictSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Select 
          value={zoningDistrict} 
          onValueChange={onChange}
          disabled={loadingZoningData}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingZoningData ? "Loading zoning data..." : "Select zoning district"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map(district => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loadingZoningData && (
          <div className="absolute right-10 top-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!loadingZoningData && (
          <Button 
            type="button" 
            variant={populationAttempted && lastPopulationSuccess ? "outline" : "default"} 
            size="sm" 
            className={`mt-2 flex-1 ${populationAttempted && lastPopulationSuccess ? 'bg-green-50 border-green-300 hover:bg-green-100 text-green-700' : populationAttempted ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-700' : ''}`}
            onClick={onApplyStandards}
            disabled={!zoningDistrict || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : populationAttempted && lastPopulationSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Applied Successfully
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Zoning Standards
              </>
            )}
          </Button>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={showMatchDetails ? "secondary" : "outline"}
                size="sm"
                className="mt-2"
                onClick={() => setShowMatchDetails(!showMatchDetails)}
              >
                <Bug className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show debug information to troubleshoot matching issues</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ZoningDistrictSelector;
