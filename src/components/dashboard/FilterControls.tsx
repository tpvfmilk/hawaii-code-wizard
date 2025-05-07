
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { counties } from "@/data/codeData";

interface FilterControlsProps {
  selectedCounty: string;
  onCountyChange: (value: string) => void;
  onClearFilter: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  selectedCounty, 
  onCountyChange, 
  onClearFilter 
}) => {
  return (
    <div className="mb-6">
      <Label htmlFor="county-filter" className="mb-2 block">County Filter</Label>
      <div className="flex gap-2">
        <Select
          value={selectedCounty}
          onValueChange={onCountyChange}
        >
          <SelectTrigger id="county-filter" className="w-[300px] flex items-center">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select county to filter data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Counties</SelectItem>
            {counties.map((county) => (
              <SelectItem key={county.id} value={county.id}>
                {county.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedCounty && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilter}
            className="flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Clear Filter
          </Button>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">
        {selectedCounty 
          ? `Showing data for ${counties.find(c => c.id === selectedCounty)?.name || selectedCounty}` 
          : 'Showing data for all counties'}
      </p>
    </div>
  );
};

export default FilterControls;
