
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DatasetKey, ColumnConfig } from "@/types/dashboard";

interface DatasetTableProps {
  data: any[] | null;
  columns: ColumnConfig[];
  onCellEdit: (rowIndex: number, columnKey: string, value: string) => void;
  selectedCounty: string;
}

const DatasetTable: React.FC<DatasetTableProps> = ({ 
  data, 
  columns, 
  onCellEdit,
  selectedCounty
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-gray-50">
        <p className="text-gray-500">No data available. Please upload a CSV file.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={row.id || rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey}>
                  <Input
                    value={row[column.accessorKey] || ''}
                    onChange={(e) => onCellEdit(rowIndex, column.accessorKey, e.target.value)}
                    readOnly={column.accessorKey === 'county' && !!selectedCounty}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DatasetTable;
