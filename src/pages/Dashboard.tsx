import React, { useEffect, useState, useRef } from 'react';
import { useProject } from '@/hooks/use-project';
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Plus, 
  Search, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Info,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, debugCSVContent } from "@/utils/CSVHelper";
import { supabase, normalizeCSVColumns, logColumnTransformation } from "@/integrations/supabase/client";
import { counties } from "@/data/codeData";

// Define literal type for valid table names in our database
type TableName = 'zoning_standards' | 'parking_requirements' | 'ada_requirements' | 'csv_datasets';

// Define interfaces for each dataset type to avoid recursive types
interface DatasetInfo {
  name: string;
  type: string;
  status: "missing" | "loaded" | "uploading";
  lastUpdated: string | null;
  notes: string;
  data: any[] | null;
}

// Simple string literal types
type DatasetKey = 'zoning' | 'parking' | 'ada';

// Simple record types that won't cause recursive definitions
type DatasetMap = {
  zoning: DatasetInfo;
  parking: DatasetInfo;
  ada: DatasetInfo;
};

type FilterMap = {
  zoning: string;
  parking: string;
  ada: string;
};

// Column configuration interface
interface ColumnConfig {
  header: string;
  accessorKey: string;
}

// Define column configurations explicitly without using Record type
type ColumnConfigMap = {
  zoning: Array<ColumnConfig>;
  parking: Array<ColumnConfig>;
  ada: Array<ColumnConfig>;
};

const Dashboard = () => {
  const { toast } = useToast();
  const { currentProject } = useProject();
  
  // Update page title based on current project
  useEffect(() => {
    document.title = currentProject ? 
      `Dashboard - ${currentProject.name}` : 
      'Data Dashboard';
  }, [currentProject]);
  
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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<DatasetKey>("zoning");
  
  // County filter state
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  
  // Input refs for file uploads
  const zoningInputRef = useRef<HTMLInputElement>(null);
  const parkingInputRef = useRef<HTMLInputElement>(null);
  const adaInputRef = useRef<HTMLInputElement>(null);
  
  // Search filters
  const [filters, setFilters] = useState<FilterMap>({
    zoning: "",
    parking: "",
    ada: ""
  });
  
  // Debug state
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, [selectedCounty]);
  
  // Column configurations for each dataset
  const columnConfigs: ColumnConfigMap = {
    zoning: [
      { header: "County", accessorKey: "county" },
      { header: "Zoning District", accessorKey: "zoning_district" },
      { header: "Front Setback", accessorKey: "front_setback" },
      { header: "Side Setback", accessorKey: "side_setback" },
      { header: "Rear Setback", accessorKey: "rear_setback" },
      { header: "Max FAR", accessorKey: "max_far" },
      { header: "Max Height", accessorKey: "max_height" },
      { header: "Max Lot Coverage", accessorKey: "max_lot_coverage" }
    ],
    parking: [
      { header: "County", accessorKey: "county" },
      { header: "Use Type", accessorKey: "use_type" },
      { header: "Parking Requirement", accessorKey: "parking_requirement" }
    ],
    ada: [
      { header: "Total Parking Spaces", accessorKey: "total_parking_spaces_provided" },
      { header: "Minimum Required ADA Stalls", accessorKey: "minimum_required_ada_stalls" }
    ]
  };
  
  // Helper function to safely get a table reference
  const getTableRef = (tableName: string) => {
    // Validate if the table name is one of our known tables
    if (
      tableName === 'zoning_standards' || 
      tableName === 'parking_requirements' || 
      tableName === 'ada_requirements' || 
      tableName === 'csv_datasets'
    ) {
      return supabase.from(tableName as TableName);
    }
    
    console.error(`Invalid table name: ${tableName}`);
    throw new Error(`Invalid table name: ${tableName}`);
  };
  
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
  
  // Function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, datasetKey: DatasetKey) => {
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
      
      // Log transformation for debugging
      logColumnTransformation(parsedCSV.data, normalizedData);
      
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
      if (datasetKey === 'zoning' && zoningInputRef.current) {
        zoningInputRef.current.value = '';
      } else if (datasetKey === 'parking' && parkingInputRef.current) {
        parkingInputRef.current.value = '';
      } else if (datasetKey === 'ada' && adaInputRef.current) {
        adaInputRef.current.value = '';
      }
    }
  };
  
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
  
  // Save dataset to Supabase
  const saveDataset = async (datasetKey: DatasetKey, data: any[]) => {
    const tableMap: Record<DatasetKey, TableName> = {
      zoning: 'zoning_standards',
      parking: 'parking_requirements',
      ada: 'ada_requirements'
    };
    
    const tableName = tableMap[datasetKey];
    
    // Process data (we removed parking field processing since those fields are gone)
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
    
    // Then insert new records (without using ON CONFLICT)
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
      // We need to await the response to access the error property
      const response = await supabase
        .from('csv_datasets')
        .upsert({
          name: datasets[datasetKey].name,
          type: `${datasetKey}_standards`,
          notes
        }, {
          onConflict: 'type'
        });
        
      // Handle potential error synchronously
      if (response.error) {
        console.error('Error saving notes:', response.error);
        toast({
          title: "Error saving notes",
          description: "Failed to save notes. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Success notification
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
    const emptyRow: any = {};
    
    // Create an empty row with all required columns
    columnConfigs[datasetKey].forEach(column => {
      emptyRow[column.accessorKey] = '';
    });
    
    // Add id for tracking
    emptyRow.id = `new-${Date.now()}`;
    
    // Add county if selected and applicable
    if (selectedCounty && (datasetKey === 'zoning' || datasetKey === 'parking')) {
      emptyRow.county = selectedCounty;
    }
    
    // Add to dataset
    setDatasets(prev => ({
      ...prev,
      [datasetKey]: {
        ...prev[datasetKey],
        data: [...(prev[datasetKey].data || []), emptyRow]
      }
    }));
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
  
  // Handle download CSV
  const handleDownloadCSV = (datasetKey: DatasetKey) => {
    if (!datasets[datasetKey].data) return;
    
    // Convert data to CSV
    const headers = columnConfigs[datasetKey].map(col => col.header);
    const keys = columnConfigs[datasetKey].map(col => col.accessorKey);
    
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

  // Handle county selection change
  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Dashboard</h1>
            {currentProject && (
              <p className="text-muted-foreground mt-1">
                Project: {currentProject.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDebugMode(!debugMode)}
            className="flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {debugMode ? 'Hide Debug' : 'Show Debug'}
          </Button>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> 
              Back to Wizard
            </Button>
          </Link>
        </div>
      </header>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>CSV Management</CardTitle>
          <CardDescription>
            Upload and manage CSV files for zoning, parking, and ADA requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="county-filter" className="mb-2 block">County Filter</Label>
            <div className="flex gap-2">
              <Select
                value={selectedCounty}
                onValueChange={handleCountyChange}
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
                  onClick={() => setSelectedCounty('')}
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Clear Filter
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {selectedCounty ? `Showing data for ${counties.find(c => c.id === selectedCounty)?.name || selectedCounty}` : 'Showing data for all counties'}
            </p>
          </div>
          
          {debugMode && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                CSV Column Mapping Guidelines
              </AlertTitle>
              <AlertDescription className="text-blue-700">
                <p className="mb-2">Your CSV file's column names must match these formats:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Zoning Standards:</strong>
                    <ul className="list-disc ml-5">
                      <li>county</li>
                      <li>zoning_district</li>
                      <li>front_setback</li>
                      <li>side_setback</li>
                      <li>rear_setback</li>
                      <li>max_far</li>
                      <li>max_height</li>
                      <li>max_lot_coverage</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Parking Requirements:</strong>
                    <ul className="list-disc ml-5">
                      <li>county</li>
                      <li>use_type</li>
                      <li>parking_requirement</li>
                    </ul>
                  </div>
                  <div>
                    <strong>ADA Requirements:</strong>
                    <ul className="list-disc ml-5">
                      <li>total_parking_spaces_provided</li>
                      <li>minimum_required_ada_stalls</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-2 text-xs">Note: The app will try to normalize column names, but it's best to match these exactly.</p>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Zoning Standards Upload */}
            <div className="space-y-2">
              <Label htmlFor="zoning-upload">Zoning Standards</Label>
              <div className="flex gap-2">
                <Input 
                  id="zoning-upload" 
                  ref={zoningInputRef}
                  type="file" 
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'zoning')}
                />
                {datasets.zoning.status === 'loaded' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
                  </Badge>
                )}
                {datasets.zoning.status === 'missing' && (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" /> Missing
                  </Badge>
                )}
                {datasets.zoning.status === 'uploading' && (
                  <Badge variant="outline">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
                    Uploading
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Parking Requirements Upload */}
            <div className="space-y-2">
              <Label htmlFor="parking-upload">Parking Requirements</Label>
              <div className="flex gap-2">
                <Input 
                  id="parking-upload" 
                  ref={parkingInputRef}
                  type="file" 
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'parking')}
                />
                {datasets.parking.status === 'loaded' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
                  </Badge>
                )}
                {datasets.parking.status === 'missing' && (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" /> Missing
                  </Badge>
                )}
                {datasets.parking.status === 'uploading' && (
                  <Badge variant="outline">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
                    Uploading
                  </Badge>
                )}
              </div>
            </div>
            
            {/* ADA Requirements Upload */}
            <div className="space-y-2">
              <Label htmlFor="ada-upload">ADA Requirements</Label>
              <div className="flex gap-2">
                <Input 
                  id="ada-upload" 
                  ref={adaInputRef}
                  type="file" 
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'ada')}
                />
                {datasets.ada.status === 'loaded' && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Loaded
                  </Badge>
                )}
                {datasets.ada.status === 'missing' && (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" /> Missing
                  </Badge>
                )}
                {datasets.ada.status === 'uploading' && (
                  <Badge variant="outline">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-primary rounded-full mr-1" />
                    Uploading
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Missing Files Warning */}
          {(datasets.zoning.status === 'missing' || 
            datasets.parking.status === 'missing' || 
            datasets.ada.status === 'missing') && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Required Files</AlertTitle>
              <AlertDescription>
                Some required data files are missing. The wizard may not function correctly until all files are uploaded.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Debug Information */}
          {debugMode && debugInfo && (
            <div className="mt-6 bg-gray-50 border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">CSV Debug Information</h3>
              <div className="text-xs max-h-64 overflow-y-auto">
                <p className="font-medium">Summary: {debugInfo.summary}</p>
                <p className="mt-1">First Row:</p>
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{debugInfo.firstRow}</pre>
                
                <p className="mt-2">First Few Rows:</p>
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(debugInfo.firstFewRows, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabbed Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Data Tables</CardTitle>
          <CardDescription>
            View and edit data for each category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DatasetKey)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="zoning">Zoning Standards</TabsTrigger>
              <TabsTrigger value="parking">Parking Requirements</TabsTrigger>
              <TabsTrigger value="ada">ADA Requirements</TabsTrigger>
            </TabsList>
            
            {['zoning', 'parking', 'ada'].map((datasetKey) => (
              <TabsContent key={datasetKey} value={datasetKey} className="space-y-6">
                {/* Dataset Info and Controls */}
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{datasets[datasetKey as DatasetKey].name}</h3>
                    {datasets[datasetKey as DatasetKey].lastUpdated && (
                      <p className="text-sm text-gray-500">
                        Last updated: {new Date(datasets[datasetKey as DatasetKey].lastUpdated as string).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddRow(datasetKey as DatasetKey)} size="sm" className="flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add Row
                    </Button>
                    <Button onClick={() => handleSaveData(datasetKey as DatasetKey)} size="sm" className="flex items-center gap-1">
                      <Upload className="w-4 h-4" /> Save Changes
                    </Button>
                    <Button 
                      onClick={() => handleDownloadCSV(datasetKey as DatasetKey)} 
                      variant="outline" 
                      size="sm"
                      disabled={!datasets[datasetKey as DatasetKey].data}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Download CSV
                    </Button>
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search data..."
                    value={filters[datasetKey as DatasetKey]}
                    onChange={(e) => setFilters(prev => ({...prev, [datasetKey]: e.target.value}))}
                    className="pl-9"
                  />
                </div>
                
                {/* Data Table */}
                {datasets[datasetKey as DatasetKey].data ? (
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columnConfigs[datasetKey as DatasetKey].map((column) => (
                            <TableHead key={column.accessorKey}>{column.header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredData(datasetKey as DatasetKey).map((row, rowIndex) => (
                          <TableRow key={row.id || rowIndex}>
                            {columnConfigs[datasetKey as DatasetKey].map((column) => (
                              <TableCell key={column.accessorKey}>
                                <Input
                                  value={row[column.accessorKey] || ''}
                                  onChange={(e) => handleCellEdit(
                                    datasetKey as DatasetKey, 
                                    rowIndex, 
                                    column.accessorKey, 
                                    e.target.value
                                  )}
                                  // Make county read-only if county filter is active
                                  readOnly={column.accessorKey === 'county' && !!selectedCounty}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-md bg-gray-50">
                    <p className="text-gray-500">No data available. Please upload a CSV file.</p>
                  </div>
                )}
                
                {/* Notes Section */}
                <div className="mt-6">
                  <Label htmlFor={`${datasetKey}-notes`}>Notes</Label>
                  <Textarea
                    id={`${datasetKey}-notes`}
                    placeholder="Add notes about this dataset..."
                    value={datasets[datasetKey as DatasetKey].notes}
                    onChange={(e) => handleNotesChange(datasetKey as DatasetKey, e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
