
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ZoningCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
}

const ZoningCheckbox = ({ id, label, checked, onCheckedChange, indeterminate = false }: ZoningCheckboxProps) => {
  const checkboxRef = React.useRef<HTMLButtonElement>(null);
  
  React.useEffect(() => {
    if (checkboxRef.current) {
      // @ts-ignore - indeterminate is a valid property but not in the types
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
        ref={checkboxRef}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

export default ZoningCheckbox;
