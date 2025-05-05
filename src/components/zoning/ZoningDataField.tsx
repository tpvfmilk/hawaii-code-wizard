
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ZoningDataFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  readOnly?: boolean;
  tooltip?: string;
  isPopulated?: boolean;
  className?: string;
}

const ZoningDataField = ({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  step,
  readOnly = false,
  tooltip,
  isPopulated = false,
  className = ""
}: ZoningDataFieldProps) => {
  const inputField = (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        className={`${className} ${isPopulated ? "border-green-400 bg-green-50 transition-all duration-300" : ""} ${readOnly ? "bg-gray-50" : ""}`}
      />
      {isPopulated && (
        <p className="text-xs text-green-600 mt-1">Auto-populated from zoning data</p>
      )}
    </>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-2">{inputField}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className="space-y-2">{inputField}</div>;
};

export default ZoningDataField;
