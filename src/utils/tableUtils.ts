
import { supabase } from "@/integrations/supabase/client";
import { TableName } from "@/types/dashboard";

// Helper function to safely get a table reference
export const getTableRef = (tableName: string) => {
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
