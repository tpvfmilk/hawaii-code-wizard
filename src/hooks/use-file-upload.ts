
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { parseCSV, debugCSVContent } from "@/utils/CSVHelper";
import { normalizeCSVColumns } from "@/integrations/supabase/client";
import { DatasetKey } from "@/types/dashboard";

export const useFileUpload = (
  datasets: any, 
  setDatasets: any, 
  selectedCounty: string, 
  saveDataset: (datasetKey: DatasetKey, data: any[]) => Promise<void>
) => {
  const { toast } = useToast();
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Validate required columns for each dataset
  const validateColumns = (headers: Record<string, any>, datasetKey: DatasetKey) => {
    const requiredColumns: Record<DatasetKey, string[]> = {
      zoning: ['county', 'zoning_district', 'front_setback', 'side_setback', 'rear_setback'],
      parking: ['county', 'use_type', 'parking_requirement'],
      ada: ['total_parking_spaces_provided', 'minimum_required_ada_stalls']
    };
    
    const missingColumns = requiredColumns[datasetKey].filter(
      col => !Object.keys(headers).includes(col)
    );
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    datasetKey: DatasetKey,
    resetFileInput: () => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Update status to uploading
      setDatasets(prev => ({
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          status: 'uploading'
        }
      }));
      
      // Parse CSV file
      const fileContent = await file.text();
      
      // Debug information
      const debug = debugCSVContent(fileContent);
      setDebugInfo(debug);
      
      const parsedCSV = parseCSV(fileContent);
      
      if (!parsedCSV.data || parsedCSV.data.length === 0) {
        throw new Error('Invalid CSV format or empty file');
      }
      
      console.log("Original CSV data:", parsedCSV.data[0]);
      
      // Normalize CSV columns to match database schema
      const normalizedData = normalizeCSVColumns(
        parsedCSV.data, 
        datasetKey
      );
      
      // Validate required columns for each dataset type
      validateColumns(normalizedData[0], datasetKey);
      
      // Apply county if selected and dataset supports it
      if (selectedCounty && (datasetKey === 'zoning' || datasetKey === 'parking')) {
        normalizedData.forEach(item => {
          if (!item.county) {
            item.county = selectedCounty;
          }
        });
      }
      
      // Save to Supabase
      await saveDataset(datasetKey, normalizedData);
      
      // Update local state
      setDatasets(prev => ({
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          status: 'loaded',
          lastUpdated: new Date().toISOString(),
          data: normalizedData
        }
      }));
      
      toast({
        title: "Upload successful",
        description: `${datasets[datasetKey].name} data has been updated.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Reset status and show error
      setDatasets(prev => ({
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          status: prev[datasetKey].data ? 'loaded' : 'missing'
        }
      }));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the CSV file.",
        variant: "destructive"
      });
      
      // Show debug information
      setDebugMode(true);
    } finally {
      // Reset file input
      resetFileInput();
    }
  };

  // Handle download CSV
  const handleDownloadCSV = (datasetKey: DatasetKey, columnConfigs: any) => {
    if (!datasets[datasetKey].data) return;
    
    // Convert data to CSV
    const headers = columnConfigs[datasetKey].map((col: any) => col.header);
    const keys = columnConfigs[datasetKey].map((col: any) => col.accessorKey);
    
    let csv = headers.join(',') + '\n';
    
    datasets[datasetKey].data!.forEach(row => {
      const values = keys.map(key => {
        const value = row[key];
        // Escape commas and quotes
        return typeof value === 'string'
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csv += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${datasets[datasetKey].name.replace(/\s+/g, '_')}.csv`);
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return {
    debugMode,
    setDebugMode,
    debugInfo,
    setDebugInfo,
    handleFileUpload,
    handleDownloadCSV
  };
};
