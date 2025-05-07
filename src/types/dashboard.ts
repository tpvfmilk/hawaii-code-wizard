
// Define literal type for valid table names in our database
export type TableName = 'zoning_standards' | 'parking_requirements' | 'ada_requirements' | 'csv_datasets';

// Define interfaces and types without any recursive references
export interface DatasetInfo {
  name: string;
  type: string;
  status: "missing" | "loaded" | "uploading";
  lastUpdated: string | null;
  notes: string;
  data: any[] | null;
}

// Define dataset keys as string literals
export type DatasetKey = 'zoning' | 'parking' | 'ada';

// Define non-recursive object types with explicit properties
export interface ZoningDataset extends DatasetInfo {}
export interface ParkingDataset extends DatasetInfo {}
export interface AdaDataset extends DatasetInfo {}

// Define the dataset map with specific types for each key
export interface DatasetMap {
  zoning: ZoningDataset;
  parking: ParkingDataset;
  ada: AdaDataset;
}

// Define filter map explicitly
export interface FilterMap {
  zoning: string;
  parking: string;
  ada: string;
}

// Column configuration interface
export interface ColumnConfig {
  header: string;
  accessorKey: string;
}

// Explicit column config map without using generics
export interface ColumnConfigMap {
  zoning: ColumnConfig[];
  parking: ColumnConfig[];
  ada: ColumnConfig[];
}
