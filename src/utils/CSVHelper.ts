
export const parseCSV = (text: string): any[] => {
  // Split text into rows
  const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Parse header row
  const headers = rows[0].split(',').map(header => 
    header.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_')
  );
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    // Handle quoted values with commas inside them
    const values: string[] = [];
    let inQuote = false;
    let currentValue = '';
    
    for (let j = 0; j < rows[i].length; j++) {
      const char = rows[i][j];
      
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(currentValue.replace(/^"|"$/g, '').trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.replace(/^"|"$/g, '').trim());
    
    // Create object from headers and values
    const rowObj: any = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        rowObj[header] = values[index];
      } else {
        rowObj[header] = '';
      }
    });
    
    data.push(rowObj);
  }
  
  return data;
};

// Add the missing checkRequiredColumns function
export const checkRequiredColumns = (data: any[], requiredColumns: string[]): boolean => {
  if (!data || data.length === 0) {
    return false;
  }
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  return requiredColumns.every(col => columns.includes(col));
};

// Add the missing downloadAsCSV function
export const downloadAsCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    return;
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const val = row[header] !== null && row[header] !== undefined ? row[header].toString() : '';
      // Escape quotes and wrap in quotes if contains comma
      if (val.includes(',') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create download link
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
