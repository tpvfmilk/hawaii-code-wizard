
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { parseCSV, checkRequiredColumns } from "@/utils/CSVHelper";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, Search, Download, PlusCircle, Save, FileUp, AlertTriangle, Info } from "lucide-react";
import { Link } from "react-router-dom";

// Define required columns for each dataset type
const requiredColumns = {
  zoning: ["County", "Zoning District", "Front Setback", "Side Setback", "Rear Setback", "Max FAR", "Max Height", "Max Lot Coverage"],
  parking: ["County", "Use Type", "Parking Requirement"],
  ada: ["Total Parking Spaces Provided", "Minimum Required ADA Stalls"]
};

const datasetTypes = [
  { id: "zoning", name: "Zoning Standards", fileName: "Zoning_Standards.csv" },
  { id: "parking", name: "Parking Requirements", fileName: "Parking_Requirements.csv" },
  { id: "ada", name: "ADA Requirements", fileName: "ADA_Stall_Requirements.csv" }
];

const Dashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [datasets, setDatasets] = useState<{[key: string]: any}>({});
  const [datasetMeta, setDatasetMeta] = useState<{[key: string]: {lastUpdated: string, notes: string}}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [editingCell, setEditingCell] = useState<{rowIndex: number, columnName: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [missingDatasets, setMissingDatasets] = useState<string[]>([]);
  
  // Fetch datasets from Supabase on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  // Fetch datasets from Supabase
  const fetchDatasets = async () => {
    try {
      // Fetch dataset metadata
      const { data: metaData, error: metaError } = await supabase
        .from('csv_datasets')
        .select('*');
        
      if (metaError) throw metaError;
      
      // Check for missing datasets
      const missing: string[] = [];
      const meta: {[key: string]: {lastUpdated: string, notes: string}} = {};
      const data: {[key: string]: any} = {};
      
      if (metaData) {
        datasetTypes.forEach(type => {
          const dataset = metaData.find(d => d.type === type.id);
          if (!dataset) {
            missing.push(type.fileName);
          } else {
            meta[type.id] = {
              lastUpdated: new Date(dataset.last_updated).toLocaleString(),
              notes: dataset.notes || ""
            };
            data[type.id] = dataset.content;
          }
        });
      } else {
        datasetTypes.forEach(type => missing.push(type.fileName));
      }
      
      setMissingDatasets(missing);
      setDatasetMeta(meta);
      setDatasets(data);
      
      // Fetch actual data tables
      await Promise.all([
        fetchZoningData(),
        fetchParkingData(),
        fetchADAData()
      ]);
      
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast({
        title: "Error fetching datasets",
        description: "There was an error loading your data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const fetchZoningData = async () => {
    const { data, error } = await supabase
      .from('zoning_standards')
      .select('*');
      
    if (error) {
      console.error("Error fetching zoning data:", error);
    } else if (data && data.length > 0) {
      setDatasets(prev => ({
        ...prev,
        zoning: data
      }));
    }
  };
  
  const fetchParkingData = async () => {
    const { data, error } = await supabase
      .from('parking_requirements')
      .select('*');
      
    if (error) {
      console.error("Error fetching parking data:", error);
    } else if (data && data.length > 0) {
      setDatasets(prev => ({
        ...prev,
        parking: data
      }));
    }
  };
  
  const fetchADAData = async () => {
    const { data, error } = await supabase
      .from('ada_requirements')
      .select('*');
      
    if (error) {
      console.error("Error fetching ADA data:", error);
    } else if (data && data.length > 0) {
      setDatasets(prev => ({
        ...prev,
        ada: data
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, datasetType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = parseCSV(event.target?.result as string);
        
        // Check if CSV has required columns
        const requiredCols = requiredColumns[datasetType as keyof typeof requiredColumns];
        if (!checkRequiredColumns(csvData, requiredCols)) {
          toast({
            title: "Invalid CSV format",
            description: `CSV is missing required columns: ${requiredCols.join(", ")}`,
            variant: "destructive"
          });
          setUploading(false);
          return;
        }
        
        // Save to Supabase
        await saveDataset(datasetType, csvData);
        
        // Update state
        setDatasets(prev => ({
          ...prev,
          [datasetType]: csvData
        }));
        
        setDatasetMeta(prev => ({
          ...prev,
          [datasetType]: {
            lastUpdated: new Date().toLocaleString(),
            notes: prev[datasetType]?.notes || ""
          }
        }));
        
        // Remove from missing datasets if it was there
        const typeInfo = datasetTypes.find(t => t.id === datasetType);
        if (typeInfo && missingDatasets.includes(typeInfo.fileName)) {
          setMissingDatasets(prev => prev.filter(name => name !== typeInfo.fileName));
        }
        
        toast({
          title: "Upload successful",
          description: `${file.name} has been successfully uploaded.`
        });
        
        // Switch to the dataset tab
        setActiveTab(datasetType);
      } catch (error) {
        console.error("Error processing CSV:", error);
        toast({
          title: "Error processing CSV",
          description: "There was an error processing your CSV file. Please check the format.",
          variant: "destructive"
        });
      }
      
      setUploading(false);
    };
    
    reader.readAsText(file);
  };
  
  // Save dataset to Supabase
  const saveDataset = async (datasetType: string, data: any[]) => {
    try {
      // First save to csv_datasets table for tracking
      const typeInfo = datasetTypes.find(t => t.id === datasetType);
      if (!typeInfo) throw new Error("Invalid dataset type");
      
      // Check if dataset already exists
      const { data: existingData } = await supabase
        .from('csv_datasets')
        .select('id')
        .eq('type', datasetType)
        .single();
      
      if (existingData) {
        // Update existing record
        await supabase
          .from('csv_datasets')
          .update({
            content: data,
            last_updated: new Date()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new record
        await supabase
          .from('csv_datasets')
          .insert({
            name: typeInfo.fileName,
            type: datasetType,
            content: data
          });
      }
      
      // Then save to the specific table based on dataset type
      if (datasetType === 'zoning') {
        // Clear existing zoning data
        await supabase.from('zoning_standards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Map data to table structure and insert
        const zoningData = data.map(item => ({
          county: item.County || '',
          zoning_district: item['Zoning District'] || '',
          front_setback: item['Front Setback'] || '',
          side_setback: item['Side Setback'] || '',
          rear_setback: item['Rear Setback'] || '',
          max_far: item['Max FAR'] || '',
          max_height: item['Max Height'] || '',
          max_lot_coverage: item['Max Lot Coverage'] || '',
          parking_required: item['Parking Required'] || '',
          ada_stalls_required: item['ADA Stalls Required'] || ''
        }));
        
        await supabase.from('zoning_standards').insert(zoningData);
      } else if (datasetType === 'parking') {
        // Clear existing parking data
        await supabase.from('parking_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Map data to table structure and insert
        const parkingData = data.map(item => ({
          county: item.County || '',
          use_type: item['Use Type'] || '',
          parking_requirement: item['Parking Requirement'] || ''
        }));
        
        await supabase.from('parking_requirements').insert(parkingData);
      } else if (datasetType === 'ada') {
        // Clear existing ADA data
        await supabase.from('ada_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Map data to table structure and insert
        const adaData = data.map(item => ({
          total_parking_spaces_provided: parseInt(item['Total Parking Spaces Provided']) || 0,
          minimum_required_ada_stalls: parseInt(item['Minimum Required ADA Stalls']) || 0
        }));
        
        await supabase.from('ada_requirements').insert(adaData);
      }
      
    } catch (error) {
      console.error("Error saving dataset to Supabase:", error);
      throw error;
    }
  };
  
  // Handle cell edit
  const handleCellEdit = (rowIndex: number, columnName: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnName });
    setEditValue(String(currentValue || ''));
  };
  
  // Save cell edit
  const saveCellEdit = async (datasetType: string, rowIndex: number, columnName: string) => {
    if (editingCell) {
      const updatedDataset = [...(datasets[datasetType] || [])];
      updatedDataset[rowIndex] = {
        ...updatedDataset[rowIndex],
        [columnName]: editValue
      };
      
      try {
        // Update in Supabase
        if (datasetType === 'zoning') {
          const rowId = updatedDataset[rowIndex].id;
          const fieldMap: {[key: string]: string} = {
            'County': 'county',
            'Zoning District': 'zoning_district',
            'Front Setback': 'front_setback',
            'Side Setback': 'side_setback',
            'Rear Setback': 'rear_setback',
            'Max FAR': 'max_far',
            'Max Height': 'max_height',
            'Max Lot Coverage': 'max_lot_coverage',
            'Parking Required': 'parking_required',
            'ADA Stalls Required': 'ada_stalls_required'
          };
          
          await supabase
            .from('zoning_standards')
            .update({ [fieldMap[columnName]]: editValue })
            .eq('id', rowId);
        } else if (datasetType === 'parking') {
          const rowId = updatedDataset[rowIndex].id;
          const fieldMap: {[key: string]: string} = {
            'County': 'county',
            'Use Type': 'use_type',
            'Parking Requirement': 'parking_requirement'
          };
          
          await supabase
            .from('parking_requirements')
            .update({ [fieldMap[columnName]]: editValue })
            .eq('id', rowId);
        } else if (datasetType === 'ada') {
          const rowId = updatedDataset[rowIndex].id;
          const fieldMap: {[key: string]: string} = {
            'Total Parking Spaces Provided': 'total_parking_spaces_provided',
            'Minimum Required ADA Stalls': 'minimum_required_ada_stalls'
          };
          
          await supabase
            .from('ada_requirements')
            .update({ [fieldMap[columnName]]: editValue })
            .eq('id', rowId);
        }
        
        // Update state
        setDatasets(prev => ({
          ...prev,
          [datasetType]: updatedDataset
        }));
        
        toast({
          title: "Updated",
          description: `Updated ${columnName} successfully.`
        });
      } catch (error) {
        console.error("Error updating cell:", error);
        toast({
          title: "Error",
          description: "Failed to update data. Please try again.",
          variant: "destructive"
        });
      }
      
      setEditingCell(null);
    }
  };
  
  // Add new row
  const addNewRow = (datasetType: string) => {
    const newRow: any = {};
    
    if (datasetType === 'zoning') {
      newRow.County = '';
      newRow['Zoning District'] = '';
      newRow['Front Setback'] = '';
      newRow['Side Setback'] = '';
      newRow['Rear Setback'] = '';
      newRow['Max FAR'] = '';
      newRow['Max Height'] = '';
      newRow['Max Lot Coverage'] = '';
      newRow['Parking Required'] = '';
      newRow['ADA Stalls Required'] = '';
    } else if (datasetType === 'parking') {
      newRow.County = '';
      newRow['Use Type'] = '';
      newRow['Parking Requirement'] = '';
    } else if (datasetType === 'ada') {
      newRow['Total Parking Spaces Provided'] = '';
      newRow['Minimum Required ADA Stalls'] = '';
    }
    
    setDatasets(prev => ({
      ...prev,
      [datasetType]: [...(prev[datasetType] || []), newRow]
    }));
  };
  
  // Download CSV
  const downloadCSV = (datasetType: string) => {
    if (!datasets[datasetType] || datasets[datasetType].length === 0) {
      toast({
        title: "No data to download",
        description: "There is no data to download for this dataset.",
        variant: "destructive"
      });
      return;
    }
    
    const typeInfo = datasetTypes.find(t => t.id === datasetType);
    if (!typeInfo) return;
    
    try {
      // Convert to CSV format
      const headers = Object.keys(datasets[datasetType][0]);
      const csvContent = [
        headers.join(','),
        ...datasets[datasetType].map((row: any) => headers.map(header => row[header]).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', typeInfo.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Error",
        description: "Failed to download CSV file.",
        variant: "destructive"
      });
    }
  };
  
  // Update dataset notes
  const updateDatasetNotes = async (datasetType: string, notes: string) => {
    try {
      const { data } = await supabase
        .from('csv_datasets')
        .select('id')
        .eq('type', datasetType)
        .single();
        
      if (data) {
        await supabase
          .from('csv_datasets')
          .update({ notes })
          .eq('id', data.id);
          
        setDatasetMeta(prev => ({
          ...prev,
          [datasetType]: {
            ...prev[datasetType],
            notes
          }
        }));
        
        toast({
          title: "Notes updated",
          description: "Dataset notes have been updated successfully."
        });
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Error",
        description: "Failed to update notes.",
        variant: "destructive"
      });
    }
  };
  
  // Export all datasets as ZIP
  const exportAllDatasets = () => {
    toast({
      title: "Export feature",
      description: "This feature is not yet implemented."
    });
  };
  
  // Filter data based on search query and column
  const getFilteredData = (datasetType: string) => {
    if (!datasets[datasetType]) return [];
    
    if (!searchQuery) return datasets[datasetType];
    
    return datasets[datasetType].filter((row: any) => {
      if (filterColumn && row[filterColumn]) {
        return String(row[filterColumn]).toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        // Search across all columns
        return Object.values(row).some(
          (value) => value && String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    });
  };
  
  // Get column names for a dataset
  const getColumnNames = (datasetType: string) => {
    if (!datasets[datasetType] || datasets[datasetType].length === 0) {
      return [];
    }
    return Object.keys(datasets[datasetType][0]);
  };
  
  // Render table headers
  const renderTableHeaders = (datasetType: string) => {
    const columns = getColumnNames(datasetType);
    return (
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column}>{column}</TableHead>
        ))}
        <TableHead>Actions</TableHead>
      </TableRow>
    );
  };
  
  // Render table rows
  const renderTableRows = (datasetType: string) => {
    const filteredData = getFilteredData(datasetType);
    return filteredData.map((row: any, rowIndex: number) => (
      <TableRow key={rowIndex}>
        {Object.entries(row).map(([columnName, value]) => (
          <TableCell key={columnName}>
            {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === columnName ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full"
                />
                <Button 
                  size="sm" 
                  onClick={() => saveCellEdit(datasetType, rowIndex, columnName)}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:bg-gray-100 p-1 rounded" 
                onClick={() => handleCellEdit(rowIndex, columnName, value)}
              >
                {value}
              </div>
            )}
          </TableCell>
        ))}
        <TableCell>
          {/* Additional actions like delete row could go here */}
        </TableCell>
      </TableRow>
    ));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wizard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Hawaiʻi Code Wizard - Data Dashboard</h1>
        </div>
        
        {missingDatasets.length > 0 && (
          <Alert className="mb-6 bg-amber-50 border-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="ml-2">
              Missing required datasets: {missingDatasets.join(", ")}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="zoning">Zoning Standards</TabsTrigger>
            <TabsTrigger value="parking">Parking Requirements</TabsTrigger>
            <TabsTrigger value="ada">ADA Requirements</TabsTrigger>
          </TabsList>
          
          {/* Upload CSV Tab */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {datasetTypes.map((dataset) => (
                <Card key={dataset.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle>{dataset.name}</CardTitle>
                    <CardDescription>
                      Upload {dataset.fileName} to update {dataset.name.toLowerCase()}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <label htmlFor={`file-upload-${dataset.id}`} className="cursor-pointer block">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium mb-1">Click to upload</p>
                        <p className="text-xs text-gray-500">CSV format only</p>
                        <Input
                          id={`file-upload-${dataset.id}`}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, dataset.id)}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    
                    {datasets[dataset.id] && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Preview:</span>
                          <span className="text-xs text-gray-500">
                            {datasetMeta[dataset.id]?.lastUpdated ? 
                              `Last updated: ${datasetMeta[dataset.id].lastUpdated}` : ''}
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto max-h-40 border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {datasets[dataset.id] && datasets[dataset.id].length > 0 && 
                                  Object.keys(datasets[dataset.id][0]).map((column) => (
                                    <TableHead key={column} className="text-xs whitespace-nowrap">
                                      {column}
                                    </TableHead>
                                  ))
                                }
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {datasets[dataset.id] && 
                                datasets[dataset.id]
                                  .slice(0, 5)
                                  .map((row: any, index: number) => (
                                    <TableRow key={index}>
                                      {Object.values(row).map((cell: any, cellIndex: number) => (
                                        <TableCell key={cellIndex} className="text-xs py-1">
                                          {String(cell).substring(0, 20)}
                                          {String(cell).length > 20 ? '...' : ''}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))
                              }
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab(dataset.id)}
                      disabled={!datasets[dataset.id]}
                    >
                      View Full Data
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => downloadCSV(dataset.id)}
                      disabled={!datasets[dataset.id]}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Export all datasets as CSV files in a single ZIP archive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Button onClick={exportAllDatasets} className="w-full sm:w-auto">
                    <FileUp className="h-4 w-4 mr-2" />
                    Export All as ZIP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Zoning Standards Tab */}
          <TabsContent value="zoning">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Zoning Standards</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => addNewRow('zoning')} variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                    <Button 
                      onClick={() => downloadCSV('zoning')} 
                      size="sm"
                      disabled={!datasets.zoning}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <select 
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterColumn}
                    onChange={(e) => setFilterColumn(e.target.value)}
                  >
                    <option value="">All Columns</option>
                    {getColumnNames('zoning').map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {datasets.zoning ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {renderTableHeaders('zoning')}
                      </TableHeader>
                      <TableBody>
                        {renderTableRows('zoning')}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Info className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No zoning data available. Please upload a CSV file.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Collapsible className="w-full">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Dataset Notes
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2">
                      <textarea
                        value={datasetMeta.zoning?.notes || ''}
                        onChange={(e) => updateDatasetNotes('zoning', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Add notes about this dataset..."
                        rows={3}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Parking Requirements Tab */}
          <TabsContent value="parking">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Parking Requirements</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => addNewRow('parking')} variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                    <Button 
                      onClick={() => downloadCSV('parking')} 
                      size="sm"
                      disabled={!datasets.parking}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <select 
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterColumn}
                    onChange={(e) => setFilterColumn(e.target.value)}
                  >
                    <option value="">All Columns</option>
                    {getColumnNames('parking').map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {datasets.parking ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {renderTableHeaders('parking')}
                      </TableHeader>
                      <TableBody>
                        {renderTableRows('parking')}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Info className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No parking data available. Please upload a CSV file.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Collapsible className="w-full">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Dataset Notes
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2">
                      <textarea
                        value={datasetMeta.parking?.notes || ''}
                        onChange={(e) => updateDatasetNotes('parking', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Add notes about this dataset..."
                        rows={3}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* ADA Requirements Tab */}
          <TabsContent value="ada">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ADA Stall Requirements</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => addNewRow('ada')} variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                    <Button 
                      onClick={() => downloadCSV('ada')} 
                      size="sm"
                      disabled={!datasets.ada}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download CSV
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <select 
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterColumn}
                    onChange={(e) => setFilterColumn(e.target.value)}
                  >
                    <option value="">All Columns</option>
                    {getColumnNames('ada').map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {datasets.ada ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {renderTableHeaders('ada')}
                      </TableHeader>
                      <TableBody>
                        {renderTableRows('ada')}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Info className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No ADA data available. Please upload a CSV file.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Collapsible className="w-full">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Dataset Notes
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2">
                      <textarea
                        value={datasetMeta.ada?.notes || ''}
                        onChange={(e) => updateDatasetNotes('ada', e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Add notes about this dataset..."
                        rows={3}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
