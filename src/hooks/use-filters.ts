
import { useState } from 'react';
import { DatasetKey, DatasetMap } from "@/types/dashboard";

export const useFilters = (datasets: DatasetMap) => {
  // Search filters
  const [filters, setFilters] = useState<{[key in DatasetKey]: string}>({
    zoning: "",
    parking: "",
    ada: ""
  });

  // Filter data based on search term
  const getFilteredData = (datasetKey: DatasetKey) => {
    if (!datasets[datasetKey].data) return [];
    
    const searchTerm = filters[datasetKey].toLowerCase();
    
    if (!searchTerm) return datasets[datasetKey].data;
    
    return datasets[datasetKey].data!.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          return value.toString().toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
  };

  // Handle filter change
  const handleFilterChange = (datasetKey: DatasetKey, value: string) => {
    setFilters(prev => ({...prev, [datasetKey]: value}));
  };

  return {
    filters,
    getFilteredData,
    handleFilterChange
  };
};
