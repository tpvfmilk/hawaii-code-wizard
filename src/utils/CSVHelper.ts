export interface ParsedCSVData {
  data: any[];
  originalHeaders: string[];
  normalizedHeaders: string[];
}

/**
 * Parse CSV text into structured data
 * @param text The CSV text to parse
 * @returns Object containing parsed data and header information
 */
export const parseCSV = (text: string): ParsedCSVData => {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.error("CSV Parser: Invalid input - empty or non-string input");
      throw new Error("Invalid CSV: empty or non-string input");
    }
    
    // Normalize line endings for consistent processing
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split text into rows and filter out empty rows
    const rows = normalizedText.split('\n').filter(row => row.trim() !== '');
    
    if (rows.length === 0) {
      console.error("CSV Parser: No rows found in CSV");
      throw new Error("Invalid CSV: no rows found");
    }
    
    // Parse header row and preserve original headers
    const originalHeaders = parseCSVRow(rows[0]);
    
    if (originalHeaders.length === 0) {
      console.error("CSV Parser: No headers found in CSV");
      throw new Error("Invalid CSV: no headers found");
    }
    
    console.log("CSV Parser: Headers found", originalHeaders);
    
    // Create normalized headers for consistent access
    const normalizedHeaders = originalHeaders.map(header => 
      header.toLowerCase().replace(/[^a-z0-9]/g, '_')
    );
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      
      try {
        const values = parseCSVRow(rows[i]);
        
        if (values.length === 0) {
          console.warn(`CSV Parser: Empty values array for row ${i + 1}, skipping`);
          continue;
        }
        
        // Create object with normalized headers
        const rowObj: any = {};
        normalizedHeaders.forEach((header, index) => {
          if (index < values.length) {
            rowObj[header] = parseValue(values[index]);
          } else {
            rowObj[header] = '';
          }
        });
        
        // Also add a version with original headers
        originalHeaders.forEach((header, index) => {
          if (index < values.length) {
            // Only add if different from normalized
            const normalizedKey = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (normalizedKey !== header) {
              rowObj[header] = parseValue(values[index]);
            }
          }
        });
        
        data.push(rowObj);
      } catch (err) {
        console.error(`CSV Parser: Error parsing row ${i + 1}:`, err);
        console.error(`CSV Parser: Row content: "${rows[i]}"`);
        // Continue parsing other rows instead of failing completely
      }
    }
    
    if (data.length === 0) {
      console.warn("CSV Parser: No data rows found in CSV");
      throw new Error("No data rows found in CSV file");
    }
    
    console.log(`CSV Parser: Successfully parsed ${data.length} data rows`);
    
    return { data, originalHeaders, normalizedHeaders };
  } catch (err) {
    console.error("CSV Parser: Fatal error parsing CSV:", err);
    console.error("CSV Parser: First 100 chars of input:", text.substring(0, 100));
    throw new Error(`Failed to process CSV file: ${err.message || 'Unknown error'}`);
  }
};

/**
 * Parse a single CSV row, handling quoted values properly
 * @param row The CSV row string to parse
 * @returns Array of string values
 */
function parseCSVRow(row: string): string[] {
  if (!row) return [];
  
  const values: string[] = [];
  let inQuote = false;
  let currentValue = '';
  
  for (let j = 0; j < row.length; j++) {
    const char = row[j];
    
    if (char === '"') {
      if (inQuote && j < row.length - 1 && row[j + 1] === '"') {
        // Handle escaped quotes (two double quotes in a row)
        currentValue += '"';
        j++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      values.push(cleanValue(currentValue));
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(cleanValue(currentValue));
  
  return values;
}

/**
 * Check if the data includes all required columns
 * @param parsedData Parsed CSV data object or array of data objects
 * @param requiredColumns Array of required column names
 * @returns Boolean indicating if all required columns are present
 */
export const checkRequiredColumns = (parsedData: ParsedCSVData | any[], requiredColumns: string[]): boolean => {
  // If we received a ParsedCSVData object, extract the data array
  const data = Array.isArray(parsedData) ? parsedData : parsedData.data;
  
  if (!data || data.length === 0) {
    return false;
  }
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  return requiredColumns.every(col => {
    // Check both the normalized version and original version
    return columns.includes(col) || columns.includes(col.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  });
};

/**
 * Get missing columns from required list
 * @param data Array of parsed data objects
 * @param requiredColumns Array of required column names
 * @returns Array of missing column names
 */
export const getMissingColumns = (data: any[], requiredColumns: string[]): string[] => {
  if (!data || data.length === 0) {
    return requiredColumns;
  }
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  return requiredColumns.filter(col => {
    // Check both the normalized version and original version
    return !columns.includes(col) && !columns.includes(col.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  });
};

/**
 * Download data as a CSV file
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download (without extension)
 */
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

/**
 * Clean a value by trimming whitespace and removing quotes
 * @param value The string value to clean
 * @returns Cleaned string value
 */
export const cleanValue = (value: string): string => {
  if (!value) return '';
  return value.replace(/^"|"$/g, '').trim();
};

/**
 * Parse a value to its appropriate type if possible
 * @param value The string value to parse
 * @returns Parsed value (number, boolean, or original string)
 */
export const parseValue = (value: string): any => {
  // Handle empty values
  if (!value || value.trim() === '') {
    return '';
  }
  
  // Try to parse as number (with or without units)
  const numericValue = parseNumericValue(value);
  if (numericValue !== null) {
    return numericValue;
  }
  
  // Check for boolean values
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Default to the original string
  return value;
};

/**
 * Extract numeric value from a string, handling units
 * @param value String that may contain units (e.g., "10'", "25 ft", "2.5%")
 * @returns Number or null if not numeric
 */
export const parseNumericValue = (value: string): number | null => {
  // Remove common units and special characters
  const cleanedValue = value.replace(/['"\s]|ft|feet|SF|sf|%|sq\.\s*ft\.?/gi, '');
  
  // Check if the value is a valid number
  if (/^-?\d+(\.\d+)?$/.test(cleanedValue)) {
    return parseFloat(cleanedValue);
  }
  
  return null;
};

/**
 * Normalize a string for more reliable comparisons
 * Removes spaces, special characters, converts to lowercase
 * @param text The string to normalize
 * @returns Normalized string
 */
export const normalizeForComparison = (text: string): string => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[-\s()\[\]\/\\,.'"]/g, '') // Remove spaces, dashes, parentheses, brackets, slashes, commas, periods, quotes
    .replace(/residential/i, 'r')
    .replace(/commercial/i, 'c')
    .replace(/industrial/i, 'i')
    .replace(/agricultural/i, 'a')
    .replace(/apartment/i, 'apt')
    .replace(/mixed/i, 'mix')
    .replace(/use/i, '')
    .replace(/zone/i, '');
};

/**
 * Find a matching entry in zoning data based on jurisdiction and district
 * @param dataset Array of zoning data objects
 * @param jurisdiction User-selected jurisdiction
 * @param zoningDistrict User-selected zoning district
 * @returns Matching zoning data object or undefined if not found
 */
export const findZoningMatch = (
  dataset: any[], 
  jurisdiction: string, 
  zoningDistrict: string
): any | undefined => {
  if (!dataset || dataset.length === 0 || !jurisdiction || !zoningDistrict) {
    console.log("Missing data for zoning match:", { datasetLength: dataset?.length, jurisdiction, zoningDistrict });
    return undefined;
  }
  
  console.log("Finding zoning match for:", { jurisdiction, zoningDistrict });
  console.log("Zoning dataset first few items:", dataset.slice(0, 3));
  
  // First try exact match
  let match = dataset.find((row: any) => {
    // Check for county/jurisdiction match
    const countyMatches = 
      (row.county && row.county.toLowerCase() === jurisdiction.toLowerCase()) ||
      (row.jurisdiction && row.jurisdiction.toLowerCase() === jurisdiction.toLowerCase());
    
    // Check for zoning district match (exact)
    const exactDistrictMatches = 
      (row.zoning_district && row.zoning_district.toLowerCase() === zoningDistrict.toLowerCase()) ||
      (row.district && row.district.toLowerCase() === zoningDistrict.toLowerCase());
    
    const result = countyMatches && exactDistrictMatches;
    if (result) {
      console.log("Found exact match:", row);
    }
    return result;
  });
  
  if (match) {
    console.log("Exact match found:", match);
    return match;
  }
  
  console.log("No exact match found, trying advanced matching techniques");
  
  // Normalize the input zoning district for more reliable comparison
  const normalizedInput = normalizeForComparison(zoningDistrict);
  console.log("Normalized input:", normalizedInput);
  
  // Try more aggressive matching strategies
  match = dataset.find((row: any) => {
    // Must match jurisdiction
    const countyMatches = 
      (row.county && row.county.toLowerCase() === jurisdiction.toLowerCase()) ||
      (row.jurisdiction && row.jurisdiction.toLowerCase() === jurisdiction.toLowerCase());
    
    if (!countyMatches) return false;
    
    // Get district values from potential columns
    const districtVal = row.zoning_district || row.district || '';
    const normalizedDistrict = normalizeForComparison(districtVal);
    
    // Try different matching strategies
    
    // Strategy 1: Normalize both and check if one contains the other
    const containsMatch = normalizedDistrict.includes(normalizedInput) || 
                           normalizedInput.includes(normalizedDistrict);
    
    // Strategy 2: Check for code in parentheses, e.g., "Residential (R-5)"
    const codeMatch = districtVal.match(/\(([^)]+)\)/);
    const codeMatchResult = codeMatch ? 
                          normalizeForComparison(codeMatch[1]) === normalizedInput : 
                          false;
    
    // Strategy 3: Match just the alphanumeric part with the dash
    // e.g., "r-5" in "R-5 Residential" or "Residential R-5"
    const alphaNumericMatch = districtVal.match(/([a-z]-\d+)/i);
    const inputAlphaNumeric = zoningDistrict.match(/([a-z]-\d+)/i);
    
    const alphaNumericMatchResult = alphaNumericMatch && inputAlphaNumeric ? 
                                  alphaNumericMatch[1].toLowerCase() === inputAlphaNumeric[1].toLowerCase() : 
                                  false;
    
    // Strategy 4: Check for number-only match if both have numbers
    // e.g., "5" in "R-5" should match with "RS-5"
    const numberOnlyMatch = districtVal.match(/\d+/);
    const inputNumberOnly = zoningDistrict.match(/\d+/);
    
    const numberOnlyMatchResult = numberOnlyMatch && inputNumberOnly ? 
                                numberOnlyMatch[0] === inputNumberOnly[0] : 
                                false;
    
    // Check if any strategy matched
    const matched = containsMatch || codeMatchResult || alphaNumericMatchResult || numberOnlyMatchResult;
    
    if (matched) {
      console.log("Match found using advanced strategy:", {
        row: districtVal,
        input: zoningDistrict,
        normalizedRow: normalizedDistrict,
        normalizedInput,
        containsMatch,
        codeMatchResult,
        alphaNumericMatchResult,
        numberOnlyMatchResult
      });
    }
    
    return matched;
  });
  
  if (match) {
    console.log("Match found after trying all strategies:", match);
  } else {
    console.log("No match found after trying all strategies");
  }
  
  return match;
};

/**
 * Calculate parking requirements based on use type and building metrics
 * @param dataset Array of parking requirement objects or ParsedCSVData
 * @param county User-selected county/jurisdiction
 * @param useType Building use type
 * @param metrics Object containing building metrics (area, units, etc.)
 * @returns Calculated number of required parking spaces
 */
export const calculateParkingRequirements = (
  dataset: any[] | ParsedCSVData,
  county: string,
  useType: string,
  metrics: { area?: number; units?: number; }
): { required: number; description: string; } => {
  // If we received a ParsedCSVData object, extract the data array
  const data = Array.isArray(dataset) ? dataset : dataset.data;
  
  if (!data || data.length === 0) {
    return { 
      required: 0, 
      description: "No parking data available. Please upload Parking_Requirements.csv." 
    };
  }
  
  // Find matching requirement
  const match = data.find((row: any) => {
    return (
      row.county?.toLowerCase() === county.toLowerCase() && 
      row.use_type?.toLowerCase() === useType.toLowerCase()
    );
  });
  
  if (!match) {
    return { 
      required: 0, 
      description: `No parking requirement found for ${useType} in ${county}.` 
    };
  }
  
  // Parse the requirement string
  const requirement = match.parking_requirement;
  let required = 0;
  let multiplier = 0;
  let divisor = 1;
  
  // Handle different formats of parking requirements
  if (requirement.includes("per DU") || requirement.includes("per unit")) {
    // Format like "1.5 spaces per DU"
    multiplier = parseFloat(requirement) || 0;
    required = multiplier * (metrics.units || 0);
    return { 
      required: Math.ceil(required), 
      description: `${multiplier} spaces per dwelling unit × ${metrics.units} units` 
    };
  } else if (requirement.includes("per") && requirement.includes("SF")) {
    // Format like "1 per 400 SF"
    const parts = requirement.split("per");
    multiplier = parseFloat(parts[0]) || 0;
    divisor = parseNumericValue(parts[1]) || 1;
    required = (metrics.area || 0) / divisor * multiplier;
    return { 
      required: Math.ceil(required), 
      description: `${multiplier} spaces per ${divisor} SF × ${metrics.area} SF total area` 
    };
  }
  
  // Default case - couldn't parse the requirement
  return { 
    required: 0, 
    description: `Could not parse requirement: "${requirement}"` 
  };
};

/**
 * Calculate minimum required ADA parking stalls
 * @param dataset Array of ADA parking requirement objects or ParsedCSVData
 * @param totalParkingSpaces Total number of parking spaces provided
 * @returns Number of required ADA parking spaces
 */
export const calculateADAParking = (
  dataset: any[] | ParsedCSVData,
  totalParkingSpaces: number
): { required: number; description: string } => {
  // If we received a ParsedCSVData object, extract the data array
  const data = Array.isArray(dataset) ? dataset : dataset.data;
  
  if (!data || data.length === 0) {
    // Fallback calculation if no dataset is available
    if (totalParkingSpaces <= 0) return { required: 0, description: "No parking provided" };
    if (totalParkingSpaces <= 25) return { required: 1, description: "Default: 1 space for 1-25 total spaces" };
    if (totalParkingSpaces <= 50) return { required: 2, description: "Default: 2 spaces for 26-50 total spaces" };
    if (totalParkingSpaces <= 75) return { required: 3, description: "Default: 3 spaces for 51-75 total spaces" };
    if (totalParkingSpaces <= 100) return { required: 4, description: "Default: 4 spaces for 76-100 total spaces" };
    if (totalParkingSpaces <= 150) return { required: 5, description: "Default: 5 spaces for 101-150 total spaces" };
    if (totalParkingSpaces <= 200) return { required: 6, description: "Default: 6 spaces for 151-200 total spaces" };
    if (totalParkingSpaces <= 300) return { required: 7, description: "Default: 7 spaces for 201-300 total spaces" };
    if (totalParkingSpaces <= 400) return { required: 8, description: "Default: 8 spaces for 301-400 total spaces" };
    if (totalParkingSpaces <= 500) return { required: 9, description: "Default: 9 spaces for 401-500 total spaces" };
    
    // For larger parking lots
    if (totalParkingSpaces <= 1000) {
      const required = Math.ceil(totalParkingSpaces * 0.02);
      return { required, description: "Default: 2% of total spaces for 501-1000 total spaces" };
    }
    
    // Over 1000 spaces
    const required = 20 + Math.ceil((totalParkingSpaces - 1000) / 100);
    return { required, description: "Default: 20 + 1 per 100 spaces over 1000" };
  }
  
  // Use the provided dataset to find the matching range
  for (const row of data) {
    const rangeString = row.total_parking_spaces_provided?.toString() || "";
    
    // Handle different range formats
    if (rangeString.includes("-")) {
      // Format like "26-50"
      const [min, max] = rangeString.split("-").map(n => parseInt(n.trim(), 10));
      if (totalParkingSpaces >= min && totalParkingSpaces <= max) {
        return { 
          required: row.minimum_required_ada_stalls, 
          description: `${row.minimum_required_ada_stalls} spaces required for ${rangeString} total spaces` 
        };
      }
    } else if (rangeString.includes("and over") || rangeString.includes("+")) {
      // Format like "1001 and over" or "1001+"
      const threshold = parseInt(rangeString.match(/\d+/)[0], 10);
      if (totalParkingSpaces >= threshold) {
        // Special calculation for large parking lots
        if (threshold === 1001 || threshold === 1000) {
          const required = 20 + Math.ceil((totalParkingSpaces - 1000) / 100);
          return { required, description: "20 + 1 per 100 spaces over 1000" };
        } else if (threshold === 501) {
          const required = Math.ceil(totalParkingSpaces * 0.02);
          return { required, description: "2% of total spaces for 501-1000 total spaces" };
        } else {
          return { 
            required: row.minimum_required_ada_stalls, 
            description: `${row.minimum_required_ada_stalls} spaces required for ${rangeString} total spaces` 
          };
        }
      }
    } else if (!isNaN(parseInt(rangeString, 10))) {
      // Exact number match
      const exact = parseInt(rangeString, 10);
      if (totalParkingSpaces === exact) {
        return { 
          required: row.minimum_required_ada_stalls,
          description: `${row.minimum_required_ada_stalls} spaces required for exactly ${rangeString} total spaces` 
        };
      }
    }
  }
  
  // Default fallback if no match found
  return { 
    required: 0, 
    description: "No matching ADA requirement found. Please check your ADA_Stall_Requirements.csv file." 
  };
};

/**
 * Look up IBC building height limits based on occupancy and construction
 * @param dataset Array of IBC height limit objects or ParsedCSVData
 * @param occupancyGroup IBC occupancy group
 * @param constructionType IBC construction type
 * @param sprinklered Whether the building is sprinklered
 * @returns Maximum building height in feet
 */
export const lookupBuildingHeight = (
  dataset: any[] | ParsedCSVData,
  occupancyGroup: string,
  constructionType: string,
  sprinklered: boolean
): { limit: number; description: string } => {
  // If we received a ParsedCSVData object, extract the data array
  const data = Array.isArray(dataset) ? dataset : dataset.data;
  
  if (!data || data.length === 0) {
    return { 
      limit: 0, 
      description: "No IBC height data available. Please upload IBC Table 504.3 CSV file." 
    };
  }
  
  // Find the matching row
  const match = data.find((row: any) => {
    return (
      row.occupancy?.toLowerCase() === occupancyGroup.toLowerCase() && 
      row.type_of_construction?.toLowerCase() === constructionType.toLowerCase()
    );
  });
  
  if (!match) {
    return { 
      limit: 0, 
      description: `No height limit found for ${occupancyGroup} with ${constructionType} construction.` 
    };
  }
  
  // Get the appropriate column based on sprinkler status
  const columnName = sprinklered ? "s" : "ns";
  const limit = parseNumericValue(match[columnName]) || 0;
  
  return { 
    limit, 
    description: `Maximum ${limit} ft for ${occupancyGroup} with ${constructionType} construction, ${sprinklered ? 'sprinklered' : 'non-sprinklered'}.` 
  };
};

/**
 * Validate that uploaded CSV has the expected structure for a particular dataset
 * @param data Parsed CSV data or array of data objects
 * @param datasetType Type of dataset (e.g., "zoning", "parking")
 * @returns Object with validation result and error message
 */
export const validateDatasetStructure = (
  data: any[] | ParsedCSVData, 
  datasetType: string
): { valid: boolean; message: string; missingColumns: string[] } => {
  // If we received a ParsedCSVData object, extract the data array
  const dataArray = Array.isArray(data) ? data : data.data;
  
  if (!dataArray || dataArray.length === 0) {
    return { 
      valid: false, 
      message: "The uploaded file contains no data.", 
      missingColumns: [] 
    };
  }
  
  const requiredColumns: { [key: string]: string[] } = {
    zoning: ["county", "zoning_district", "front_setback", "side_setback", "rear_setback", "max_height", "max_far", "max_lot_coverage"],
    parking: ["county", "use_type", "parking_requirement"],
    ada: ["total_parking_spaces_provided", "minimum_required_ada_stalls"],
    heightLimits: ["occupancy", "type_of_construction", "ns", "s"],
    storyLimits: ["occupancy", "type_of_construction", "ns", "s"],
    areaLimits: ["occupancy", "type_of_construction", "ns", "s"]
  };
  
  if (!requiredColumns[datasetType]) {
    return { 
      valid: true, 
      message: "No validation rules defined for this dataset type.", 
      missingColumns: [] 
    };
  }
  
  const missingColumns = getMissingColumns(dataArray, requiredColumns[datasetType]);
  
  if (missingColumns.length > 0) {
    return {
      valid: false,
      message: `The uploaded file is missing required columns: ${missingColumns.join(", ")}`,
      missingColumns
    };
  }
  
  return {
    valid: true,
    message: `${dataArray.length} records successfully validated.`,
    missingColumns: []
  };
};

/**
 * Debug CSV content to help with parsing issues
 * @param fileContent Raw CSV file content
 * @returns Summary of CSV structure
 */
export const debugCSVContent = (fileContent: string): { 
  summary: string;
  firstRow: string;
  charCodes: number[];
  firstFewRows: string[];
} => {
  if (!fileContent) {
    return {
      summary: "Empty content",
      firstRow: "",
      charCodes: [],
      firstFewRows: []
    };
  }
  
  const normalizedText = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalizedText.split('\n').filter(row => row.trim() !== '');
  const firstRow = rows.length > 0 ? rows[0] : '';
  
  // Get char codes for the first row to debug invisible characters
  const charCodes = firstRow.split('').map(char => char.charCodeAt(0));
  
  // Get first few rows
  const firstFewRows = rows.slice(0, Math.min(3, rows.length));
  
  return {
    summary: `File has ${rows.length} non-empty rows. First row length: ${firstRow.length} chars.`,
    firstRow,
    charCodes,
    firstFewRows
  };
};
