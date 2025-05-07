
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTableRef } from "@/utils/tableUtils";
import { DatasetMap, DatasetKey, TableName } from "@/types/dashboard";

export const useDatasets = () => {
  const { toast } = useToast();
  
  // Datasets state
  const [datasets, setDatasets] = useState<DatasetMap>({
    zoning: {
      name: "Zoning Standards",
      type: "zoning_standards",
      status: "missing",
      lastUpdated: null,
      notes: "",
      data: null
    },
    parking: {
      name: "Parking Requirements",
      type: "parking_requirements",
      status: "missing",
      lastUpdated: null,
      notes: "",
      data: null
    },
    ada: {
      name: "ADA Stall Requirements",
      type: "ada_requirements",
      status: "missing",
      lastUpdated: null,
      notes: "",
      data: null
    }
  });
  
  // County filter state
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  
  // Function to fetch all datasets from Supabase
  const fetchDatasets = async () => {
    try {
      // Fetch metadata about uploaded CSV files
      const { data: metaData } = await supabase
        .from('csv_datasets')
        .select('*');
        
      if (metaData) {
        // Create a temporary copy of the datasets state
        const updatedDatasets = { ...datasets };
        
        // Update dataset metadata from database records
        metaData.forEach((record) => {
          const datasetKey = record.type.includes('zoning') 
            ? 'zoning' 
            : record.type.includes('parking') 
              ? 'parking' 
              : 'ada';
              
          if (updatedDatasets[datasetKey as DatasetKey]) {
            updatedDatasets[datasetKey as DatasetKey] = {
              ...updatedDatasets[datasetKey as DatasetKey],
              status: 'loaded',
              lastUpdated: record.last_updated,
              notes: record.notes || ''
            };
          }
        });
        
        // Fetch actual data for each dataset
        for (const key of Object.keys(updatedDatasets) as DatasetKey[]) {
          const tableMap: Record<DatasetKey, TableName> = {
            zoning: 'zoning_standards',
            parking: 'parking_requirements',
            ada: 'ada_requirements'
          };
          
          const tableName = tableMap[key];
          if (tableName) {
            let query = supabase.from(tableName).select('*');
            
            // Apply county filter if selected
            if (selectedCounty && (key === 'zoning' || key === 'parking')) {
              query = query.eq('county', selectedCounty);
            }
            
            const { data } = await query;
              
            if (data && data.length > 0) {
              updatedDatasets[key].data = data;
              updatedDatasets[key].status = 'loaded';
            } else {
              // If no data found with filter, set to null
              updatedDatasets[key].data = null;
              updatedDatasets[key].status = 'missing';
            }
          }
        }
        
        // Update state with fetched data
        setDatasets(updatedDatasets);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast({
        title: "Error loading data",
        description: "Could not fetch datasets from the database.",
        variant: "destructive"
      });
    }
  };
  
  // Handle county selection change
  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
  };
  
  // Run fetch datasets when county filter changes
  useEffect(() => {
    fetchDatasets();
  }, [selectedCounty]);
  
  // Save dataset to Supabase
  const saveDataset = async (datasetKey: DatasetKey, data: any[]) => {
    const tableMap: Record<DatasetKey, TableName> = {
      zoning: 'zoning_standards',
      parking: 'parking_requirements',
      ada: 'ada_requirements'
    };
    
    const tableName = tableMap[datasetKey];
    
    // Process data
    let processedData = [...data];
    
    // First, delete existing records based on county filter
    let deleteQuery = getTableRef(tableName).delete();
    
    // If county filter is active and applicable to this dataset
    if (selectedCounty && (datasetKey === 'zoning' || datasetKey === 'parking')) {
      deleteQuery = deleteQuery.eq('county', selectedCounty);
    } else {
      deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    
    const { error: deleteError } = await deleteQuery;
    
    if (deleteError) {
      console.error(`Error deleting existing records: ${deleteError.message}`);
      throw deleteError;
    }
    
    // Then insert new records
    const { error } = await getTableRef(tableName).insert(processedData);
    
    if (error) throw error;
    
    // Update metadata
    try {
      // First check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('csv_datasets')
        .select('*')
        .eq('type', tableName);
        
      if (checkError) throw checkError;
      
      if (existingData && existingData.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('csv_datasets')
          .update({
            name: datasets[datasetKey].name,
            content: JSON.stringify(data.slice(0, 10)), // Store preview data
            last_updated: new Date().toISOString(),
            notes: datasets[datasetKey].notes
          })
          .eq('type', tableName);
          
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('csv_datasets')
          .insert({
            name: datasets[datasetKey].name,
            type: tableName,
            content: JSON.stringify(data.slice(0, 10)), // Store preview data
            last_updated: new Date().toISOString(),
            notes: datasets[datasetKey].notes
          });
          
        if (insertError) throw insertError;
      }
    } catch (metaError) {
      console.error('Error updating metadata:', metaError);
      throw metaError;
    }
  };

  // Handle notes change
  const handleNotesChange = async (datasetKey: DatasetKey, notes: string) => {
    setDatasets(prev => ({
      ...prev,
      [datasetKey]: {
        ...prev[datasetKey],
        notes
      }
    }));
    
    // Save notes to database
    try {
      const response = await supabase
        .from('csv_datasets')
        .upsert({
          name: datasets[datasetKey].name,
          type: `${datasetKey}_standards`,
          notes
        }, {
          onConflict: 'type'
        });
        
      if (response.error) {
        console.error('Error saving notes:', response.error);
        toast({
          title: "Error saving notes",
          description: "Failed to save notes. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Notes saved",
        description: `Notes for ${datasets[datasetKey].name} have been updated.`,
      });
    } catch (error) {
      console.error('Error in notes update process:', error);
      toast({
        title: "Error saving notes",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle adding a new row
  const handleAddRow = (datasetKey: DatasetKey) => {
    setDatasets(prev => {
      if (!prev[datasetKey].data) {
        return {
          ...prev,
          [datasetKey]: {
            ...prev[datasetKey],
            data: [{ id: `new-${Date.now()}` }]
          }
        };
      }

      const emptyRow: any = {};
      
      // Create an empty row with id for tracking
      emptyRow.id = `new-${Date.now()}`;
      
      // Add county if selected and applicable
      if (selectedCounty && (datasetKey === 'zoning' || datasetKey === 'parking')) {
        emptyRow.county = selectedCounty;
      }
      
      return {
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          data: [...prev[datasetKey].data!, emptyRow]
        }
      };
    });
  };
  
  // Handle cell edit
  const handleCellEdit = (datasetKey: DatasetKey, rowIndex: number, columnKey: string, value: string) => {
    setDatasets(prev => {
      if (!prev[datasetKey].data) return prev;
      
      const newData = [...prev[datasetKey].data!];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnKey]: value
      };
      
      return {
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          data: newData
        }
      };
    });
  };
  
  // Save edited data
  const handleSaveData = async (datasetKey: DatasetKey) => {
    if (!datasets[datasetKey].data) return;
    
    try {
      await saveDataset(datasetKey, datasets[datasetKey].data);
      
      toast({
        title: "Data saved",
        description: `${datasets[datasetKey].name} data has been saved to the database.`,
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Save failed",
        description: "Could not save data to the database.",
        variant: "destructive"
      });
    }
  };

  return {
    datasets,
    setDatasets,
    selectedCounty,
    fetchDatasets,
    handleCountyChange,
    handleNotesChange,
    handleAddRow,
    handleCellEdit,
    handleSaveData,
    saveDataset
  };
};
