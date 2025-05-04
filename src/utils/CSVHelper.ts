
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
