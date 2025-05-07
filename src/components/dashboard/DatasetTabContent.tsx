
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { DatasetKey, DatasetMap, ColumnConfigMap, FilterMap } from "@/types/dashboard";
import DatasetControls from '@/components/dashboard/DatasetControls';
import SearchBox from '@/components/dashboard/SearchBox';
import DatasetTable from '@/components/dashboard/DatasetTable';
import DatasetNotes from '@/components/dashboard/DatasetNotes';

interface DatasetTabContentProps {
  datasetKey: DatasetKey;
  datasets: DatasetMap;
  filters: FilterMap;
  columnConfigs: ColumnConfigMap;
  selectedCounty: string;
  onAddRow: (datasetKey: DatasetKey) => void;
  onSaveData: (datasetKey: DatasetKey) => void;
  onDownloadCSV: (datasetKey: DatasetKey) => void;
  onFilterChange: (datasetKey: DatasetKey, value: string) => void;
  onCellEdit: (datasetKey: DatasetKey, rowIndex: number, columnKey: string, value: string) => void;
  onNotesChange: (datasetKey: DatasetKey, notes: string) => void;
  filteredData: any[] | null;
}

const DatasetTabContent: React.FC<DatasetTabContentProps> = ({
  datasetKey,
  datasets,
  filters,
  columnConfigs,
  selectedCounty,
  onAddRow,
  onSaveData,
  onDownloadCSV,
  onFilterChange,
  onCellEdit,
  onNotesChange,
  filteredData
}) => {
  return (
    <TabsContent value={datasetKey} className="space-y-6">
      <DatasetControls 
        datasetKey={datasetKey}
        dataset={datasets[datasetKey]}
        onAddRow={() => onAddRow(datasetKey)}
        onSaveChanges={() => onSaveData(datasetKey)}
        onDownloadCSV={() => onDownloadCSV(datasetKey)}
      />
      
      <SearchBox 
        value={filters[datasetKey]}
        onChange={(value) => onFilterChange(datasetKey, value)}
      />
      
      <DatasetTable 
        data={filteredData}
        columns={columnConfigs[datasetKey]}
        onCellEdit={(rowIndex, columnKey, value) => 
          onCellEdit(datasetKey, rowIndex, columnKey, value)
        }
        selectedCounty={selectedCounty}
      />
      
      <DatasetNotes 
        datasetKey={datasetKey}
        notes={datasets[datasetKey].notes}
        onNotesChange={onNotesChange}
      />
    </TabsContent>
  );
};

export default DatasetTabContent;
