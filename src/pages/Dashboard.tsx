
import React, { useEffect, useRef } from 'react';
import { useProject } from '@/hooks/use-project';
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Info } from "lucide-react";

// Import custom components
import FilterControls from '@/components/dashboard/FilterControls';
import UploadSection from '@/components/dashboard/UploadSection';
import MissingFilesWarning from '@/components/dashboard/MissingFilesWarning';
import DebugInfo from '@/components/dashboard/DebugInfo';
import DatasetTabContent from '@/components/dashboard/DatasetTabContent';

// Import custom hooks
import { useDatasets } from '@/hooks/use-datasets';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useFilters } from '@/hooks/use-filters';

// Import types
import { DatasetKey, ColumnConfigMap } from '@/types/dashboard';

const Dashboard = () => {
  const { currentProject } = useProject();
  
  // Update page title based on current project
  useEffect(() => {
    document.title = currentProject ? 
      `Dashboard - ${currentProject.name}` : 
      'Data Dashboard';
  }, [currentProject]);
  
  // Use custom hooks
  const { 
    datasets, 
    setDatasets, 
    selectedCounty, 
    handleCountyChange, 
    handleNotesChange, 
    handleAddRow, 
    handleCellEdit, 
    handleSaveData, 
    saveDataset 
  } = useDatasets();
  
  const { 
    debugMode, 
    setDebugMode, 
    debugInfo, 
    handleFileUpload, 
    handleDownloadCSV 
  } = useFileUpload(datasets, setDatasets, selectedCounty, saveDataset);
  
  const { filters, getFilteredData, handleFilterChange } = useFilters(datasets);
  
  // Active tab state
  const [activeTab, setActiveTab] = React.useState<DatasetKey>("zoning");
  
  // Input refs for file uploads
  const zoningInputRef = useRef<HTMLInputElement>(null);
  const parkingInputRef = useRef<HTMLInputElement>(null);
  const adaInputRef = useRef<HTMLInputElement>(null);
  
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

  // Reset file input helpers
  const resetFileInput = (datasetKey: DatasetKey) => {
    if (datasetKey === 'zoning' && zoningInputRef.current) {
      zoningInputRef.current.value = '';
    } else if (datasetKey === 'parking' && parkingInputRef.current) {
      parkingInputRef.current.value = '';
    } else if (datasetKey === 'ada' && adaInputRef.current) {
      adaInputRef.current.value = '';
    }
  };

  // Handle file upload wrapper
  const handleFileUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>, datasetKey: DatasetKey) => {
    handleFileUpload(e, datasetKey, () => resetFileInput(datasetKey));
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
          <FilterControls 
            selectedCounty={selectedCounty} 
            onCountyChange={handleCountyChange}
            onClearFilter={() => handleCountyChange('')}
          />
          
          {debugMode && <DebugInfo debugInfo={debugInfo} />}
          
          <UploadSection 
            datasets={datasets}
            onFileUpload={handleFileUploadWrapper}
            zoningInputRef={zoningInputRef}
            parkingInputRef={parkingInputRef}
            adaInputRef={adaInputRef}
          />
          
          <MissingFilesWarning datasets={datasets} />
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
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as DatasetKey)} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="zoning">Zoning Standards</TabsTrigger>
              <TabsTrigger value="parking">Parking Requirements</TabsTrigger>
              <TabsTrigger value="ada">ADA Requirements</TabsTrigger>
            </TabsList>
            
            {(['zoning', 'parking', 'ada'] as DatasetKey[]).map((datasetKey) => (
              <DatasetTabContent 
                key={datasetKey}
                datasetKey={datasetKey}
                datasets={datasets}
                filters={filters}
                columnConfigs={columnConfigs}
                selectedCounty={selectedCounty}
                onAddRow={handleAddRow}
                onSaveData={handleSaveData}
                onDownloadCSV={() => handleDownloadCSV(datasetKey, columnConfigs)}
                onFilterChange={handleFilterChange}
                onCellEdit={handleCellEdit}
                onNotesChange={handleNotesChange}
                filteredData={getFilteredData(datasetKey)}
              />
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
