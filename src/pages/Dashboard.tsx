
import React, { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/utils/CSVHelper";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from "@/integrations/supabase/types";

// Define literal type for valid table names in our database
type TableName = 'zoning_standards' | 'parking_requirements' | 'ada_requirements' | 'csv_datasets';

interface DatasetInfo {
  name: string;
  type: string;
  status: "missing" | "loaded" | "uploading";
  lastUpdated: string | null;
  notes: string;
  data: any[] | null;
}

interface ColumnConfig {
  header: string;
  accessorKey: string;
  cell?: (info: any) => React.ReactNode;
}

const Dashboard = () => {
  const { toast } = useToast();
  
  // Datasets state
  const [datasets, setDatasets] = useState<Record<string, DatasetInfo>>({
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
  const [activeTab, setActiveTab] = useState("zoning");
  
  // Input refs for file uploads
  const zoningInputRef = useRef<HTMLInputElement>(null);
  const parkingInputRef = useRef<HTMLInputElement>(null);
  const adaInputRef = useRef<HTMLInputElement>(null);
  
  // Search filters
  const [filters, setFilters] = useState<Record<string, string>>({
    zoning: "",
    parking: "",
    ada: ""
  });
  
  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  // Column configurations for each dataset
  const columnConfigs: Record<string, ColumnConfig[]> = {
    zoning: [
      { header: "County", accessorKey: "county" },
      { header: "Zoning District", accessorKey: "zoning_district" },
      { header: "Front Setback", accessorKey: "front_setback" },
      { header: "Side Setback", accessorKey: "side_setback" },
      { header: "Rear Setback", accessorKey: "rear_setback" },
      { header: "Max FAR", accessorKey: "max_far" },
      { header: "Max Height", accessorKey: "max_height" },
      { header: "Max Lot Coverage", accessorKey: "max_lot_coverage" },
      { header: "Parking Required", accessorKey: "parking_required" },
      { header: "ADA Stalls Required", accessorKey: "ada_stalls_required" }
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
              
          if (updatedDatasets[datasetKey]) {
            updatedDatasets[datasetKey] = {
              ...updatedDatasets[datasetKey],
              status: 'loaded',
              lastUpdated: record.last_updated,
              notes: record.notes || ''
            };
          }
        });
        
        // Fetch actual data for each dataset
        for (const key of Object.keys(updatedDatasets)) {
          const tableMap: Record<string, TableName> = {
            zoning: 'zoning_standards',
            parking: 'parking_requirements',
            ada: 'ada_requirements'
          };
          
          const tableName = tableMap[key];
          if (tableName) {
            const { data } = await supabase
              .from(tableName)
              .select('*');
              
            if (data && data.length > 0) {
              updatedDatasets[key].data = data;
              updatedDatasets[key].status = 'loaded';
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, datasetKey: string) => {
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
      const parsedData = parseCSV(fileContent);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('Invalid CSV format or empty file');
      }
      
      // Validate required columns for each dataset type
      validateColumns(parsedData[0], datasetKey);
      
      // Save to Supabase
      await saveDataset(datasetKey, parsedData);
      
      // Update local state
      setDatasets(prev => ({
        ...prev,
        [datasetKey]: {
          ...prev[datasetKey],
          status: 'loaded',
          lastUpdated: new Date().toISOString(),
          data: parsedData
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
  const validateColumns = (headers: Record<string, any>, datasetKey: string) => {
    const requiredColumns: Record<string, string[]> = {
      zoning: ['county', 'zoning_district', 'front_setback', 'side_setback', 'rear_setback'],
      parking: ['county', 'use_type', 'parking_requirement'],
      ada: ['total_parking_spaces_provided', 'minimum_required_ada_stalls']
    };
    
    const missingColumns = requiredColumns[datasetKey].filter(
      col => !Object.keys(headers).some(header => 
        header.toLowerCase().replace(/[^a-z0-9]/g, '_') === col
      )
    );
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
  };
  
  // Save dataset to Supabase
  const saveDataset = async (datasetKey: string, data: any[]) => {
    const tableMap: Record<string, TableName> = {
      zoning: 'zoning_standards',
      parking: 'parking_requirements',
      ada: 'ada_requirements'
    };
    
    const tableName = tableMap[datasetKey];
    if (!tableName) {
      throw new Error(`Invalid dataset key: ${datasetKey}`);
    }
    
    // First, delete existing records
    await getTableRef(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Then insert new records
    const { error } = await getTableRef(tableName).insert(data);
    
    if (error) throw error;
    
    // Update metadata
    const { error: metaError } = await supabase
      .from('csv_datasets')
      .upsert({
        name: datasets[datasetKey].name,
        type: tableName,
        content: JSON.stringify(data.slice(0, 10)), // Store preview data
        last_updated: new Date().toISOString(),
        notes: datasets[datasetKey].notes
      }, {
        onConflict: 'type'
      });
      
    if (metaError) throw metaError;
  };
  
  // Handle notes change
  const handleNotesChange = (datasetKey: string, notes: string) => {
    setDatasets(prev => ({
      ...prev,
      [datasetKey]: {
        ...prev[datasetKey],
        notes
      }
    }));
    
    // Save notes to database
    supabase
      .from('csv_datasets')
      .upsert({
        name: datasets[datasetKey].name,
        type: `${datasetKey}_standards`,
        notes
      }, {
        onConflict: 'type'
      })
      .then(() => {
        toast({
          title: "Notes saved",
          description: `Notes for ${datasets[datasetKey].name} have been updated.`,
        });
      })
      .catch(error => {
        console.error('Error saving notes:', error);
      });
  };
  
  // Handle adding a new row
  const handleAddRow = (datasetKey: string) => {
    const emptyRow: any = {};
    
    // Create an empty row with all required columns
    columnConfigs[datasetKey].forEach(column => {
      emptyRow[column.accessorKey] = '';
    });
    
    // Add id for tracking
    emptyRow.id = `new-${Date.now()}`;
    
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
  const handleCellEdit = (datasetKey: string, rowIndex: number, columnKey: string, value: string) => {
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
  const handleSaveData = async (datasetKey: string) => {
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
  const handleDownloadCSV = (datasetKey: string) => {
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
  const getFilteredData = (datasetKey: string) => {
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Data Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage CSV datasets for the Hawaii Code Wizard</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> 
              Back to Wizard
            </Button>
          </Link>
        </header>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>CSV Management</CardTitle>
            <CardDescription>
              Upload and manage CSV files for zoning, parking, and ADA requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="zoning">Zoning Standards</TabsTrigger>
                <TabsTrigger value="parking">Parking Requirements</TabsTrigger>
                <TabsTrigger value="ada">ADA Requirements</TabsTrigger>
              </TabsList>
              
              {['zoning', 'parking', 'ada'].map(datasetKey => (
                <TabsContent key={datasetKey} value={datasetKey} className="space-y-6">
                  {/* Dataset Info and Controls */}
                  <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">{datasets[datasetKey as keyof typeof datasets].name}</h3>
                      {datasets[datasetKey as keyof typeof datasets].lastUpdated && (
                        <p className="text-sm text-gray-500">
                          Last updated: {new Date(datasets[datasetKey as keyof typeof datasets].lastUpdated as string).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={() => handleAddRow(datasetKey)} size="sm" className="flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Row
                      </Button>
                      <Button onClick={() => handleSaveData(datasetKey)} size="sm" className="flex items-center gap-1">
                        <Upload className="w-4 h-4" /> Save Changes
                      </Button>
                      <Button 
                        onClick={() => handleDownloadCSV(datasetKey)} 
                        variant="outline" 
                        size="sm"
                        disabled={!datasets[datasetKey as keyof typeof datasets].data}
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
                      value={filters[datasetKey as keyof typeof filters]}
                      onChange={(e) => setFilters(prev => ({...prev, [datasetKey]: e.target.value}))}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Data Table */}
                  {datasets[datasetKey as keyof typeof datasets].data ? (
                    <div className="overflow-x-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columnConfigs[datasetKey].map((column) => (
                              <TableHead key={column.accessorKey}>{column.header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredData(datasetKey).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {columnConfigs[datasetKey].map((column) => (
                                <TableCell key={column.accessorKey}>
                                  <Input
                                    value={row[column.accessorKey] || ''}
                                    onChange={(e) => handleCellEdit(
                                      datasetKey, 
                                      rowIndex, 
                                      column.accessorKey, 
                                      e.target.value
                                    )}
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
                      value={datasets[datasetKey as keyof typeof datasets].notes}
                      onChange={(e) => handleNotesChange(datasetKey, e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
