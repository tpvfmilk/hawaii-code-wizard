
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search data..." 
}) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};

export default SearchBox;
