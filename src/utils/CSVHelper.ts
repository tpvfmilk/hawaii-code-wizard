
export interface CSVData {
  [key: string]: string | number;
}

export const parseCSV = (csv: string): CSVData[] => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(value => value.trim());
    const entry: CSVData = {};
    
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    
    return entry;
  });
};

export const checkRequiredColumns = (csvData: CSVData[], requiredColumns: string[]): boolean => {
  if (!csvData || csvData.length === 0) return false;
  
  const firstRow = csvData[0];
  return requiredColumns.every(column => Object.keys(firstRow).includes(column));
};

export const downloadAsCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
