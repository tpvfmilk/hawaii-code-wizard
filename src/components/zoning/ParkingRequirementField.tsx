
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ParkingRequirementFieldProps {
  spaces: string;
  unit: string;
  onSpacesChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  isPopulated?: boolean;
  tooltip?: string;
  className?: string;
}

const COMMON_UNITS = [
  { value: "DU", label: "Per Dwelling Unit" },
  { value: "SF", label: "Per Square Foot" },
  { value: "1000 SF", label: "Per 1,000 Square Feet" },
  { value: "ROOM", label: "Per Room" },
  { value: "BED", label: "Per Bed" },
  { value: "EMPLOYEE", label: "Per Employee" },
  { value: "SEAT", label: "Per Seat" },
];

const ParkingRequirementField = ({
  spaces,
  unit,
  onSpacesChange,
  onUnitChange,
  isPopulated = false,
  tooltip,
  className = ""
}: ParkingRequirementFieldProps) => {
  const content = (
    <div className="space-y-2">
      <Label htmlFor="parkingSpaces">Parking Required</Label>
      <div className="flex gap-2">
        <Input
          id="parkingSpaces"
          type="number"
          placeholder="Spaces"
          value={spaces}
          onChange={e => onSpacesChange(e.target.value)}
          min="0"
          step="0.1"
          className={`${className} ${isPopulated ? "border-green-400 bg-green-50 transition-all duration-300" : ""}`}
        />
        <Select value={unit} onValueChange={onUnitChange}>
          <SelectTrigger className={`${className} ${isPopulated ? "border-green-400 bg-green-50 transition-all duration-300" : ""}`}>
            <SelectValue placeholder="Per unit" />
          </SelectTrigger>
          <SelectContent>
            {COMMON_UNITS.map(unit => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
            {/* Allow custom units that might come from the database */}
            {unit && !COMMON_UNITS.some(u => u.value === unit) && (
              <SelectItem value={unit}>{unit}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      {isPopulated && (
        <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default ParkingRequirementField;
