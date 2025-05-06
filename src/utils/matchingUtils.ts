// Helper functions for matching zoning, occupancy, construction types
import { calculateADAParking } from "./CSVHelper";

/**
 * Find a matching zoning record from the dataset
 * @param dataset The zoning dataset to search
 * @param jurisdiction The jurisdiction (e.g., "honolulu")
 * @param districtId The district ID to match
 * @returns The matched zoning record or null if no match is found
 */
export const findZoningMatch = (dataset: any[], jurisdiction: string, districtId: string) => {
  if (!dataset || !districtId || !jurisdiction) return null;
  
  console.log(`Looking for zoning match: jurisdiction=${jurisdiction}, districtId=${districtId}`);
  
  // Create a normalized version of the district ID (lowercase, replace spaces with underscores)
  const normalizedDistrictId = districtId.toLowerCase().replace(/\s+/g, '_');
  const districtLowerCase = districtId.toLowerCase();
  
  // First, try an exact match on zoning_district (case insensitive)
  const exactMatch = dataset.find(item => 
    item.county === jurisdiction && 
    (item.zoning_district === districtId || 
     item.zoning_district.toLowerCase() === districtLowerCase ||
     item.zoning_district.toLowerCase().replace(/\s+/g, '_') === normalizedDistrictId)
  );
  
  if (exactMatch) {
    console.log("Found exact zoning match:", exactMatch);
    return exactMatch;
  }
  
  // If no exact match, try partial match (contains)
  const partialMatch = dataset.find(item => 
    item.county === jurisdiction && 
    (item.zoning_district.toLowerCase().includes(districtLowerCase) || 
     districtLowerCase.includes(item.zoning_district.toLowerCase()))
  );
  
  if (partialMatch) {
    console.log("Found partial zoning match:", partialMatch);
    return partialMatch;
  }
  
  // Try matching the beginning of the name
  const beginningMatch = dataset.find(item => 
    item.county === jurisdiction && 
    item.zoning_district.toLowerCase().startsWith(districtLowerCase)
  );
  
  if (beginningMatch) {
    console.log("Found beginning zoning match:", beginningMatch);
    return beginningMatch;
  }

  // Try matching just the first word or code
  const firstWordMatch = dataset.find(item => {
    if (item.county !== jurisdiction) return false;
    
    const itemFirstWord = item.zoning_district.split(' ')[0].toLowerCase();
    const districtFirstWord = districtId.split(' ')[0].toLowerCase();
    
    return itemFirstWord === districtFirstWord;
  });
  
  if (firstWordMatch) {
    console.log("Found first word zoning match:", firstWordMatch);
    return firstWordMatch;
  }
  
  // For district IDs that might be normalized, try to match them against the original strings
  const denormalizedMatch = dataset.find(item => {
    if (item.county !== jurisdiction) return false;
    
    // See if the district ID might be a normalized version of this item's district
    const itemNormalized = item.zoning_district.toLowerCase().replace(/\s+/g, '_');
    return itemNormalized === districtLowerCase || itemNormalized === normalizedDistrictId;
  });
  
  if (denormalizedMatch) {
    console.log("Found denormalized match:", denormalizedMatch);
    return denormalizedMatch;
  }
  
  // If all else fails, return null
  console.log("No zoning match found");
  return null;
};

/**
 * Enhanced version of findZoningMatch that returns debug information
 */
export const findZoningMatchWithDebug = (dataset: any[], jurisdiction: string, districtId: string) => {
  const debugInfo = {
    searchParameters: {
      jurisdiction,
      districtId,
      normalizedDistrictId: districtId ? districtId.toLowerCase().replace(/\s+/g, '_') : ""
    },
    jurisdictionCheck: {
      datasetValues: Array.from(new Set(dataset.map(item => item.county)))
    },
    districtCheck: {
      allValues: dataset.filter(item => item.county === jurisdiction).map(item => item.zoning_district),
      exactMatches: dataset.filter(item => 
        item.county === jurisdiction && 
        (item.zoning_district === districtId || 
         item.zoning_district.toLowerCase() === districtId.toLowerCase())
      ),
      partialMatches: dataset.filter(item => 
        item.county === jurisdiction && 
        (item.zoning_district.toLowerCase().includes(districtId.toLowerCase()) || 
         districtId.toLowerCase().includes(item.zoning_district.toLowerCase()))
      )
    }
  };
  
  const match = findZoningMatch(dataset, jurisdiction, districtId);
  
  return {
    match,
    debugInfo
  };
};

/**
 * Parse parking requirement string into components
 * @param parkingString The parking requirement string (e.g., "2 per unit")
 * @returns Object with spaces and unit
 */
export const parseParking = (parkingString: string): { spaces: string, unit: string } => {
  if (!parkingString) return { spaces: "", unit: "" };
  
  // Handle common formats:
  // "2 per unit" -> spaces: "2", unit: "per unit"
  // "1.5 spaces per dwelling" -> spaces: "1.5", unit: "spaces per dwelling"
  // "1 space / 300 SF" -> spaces: "1", unit: "space / 300 SF"
  
  const match = parkingString.match(/^([\d.]+)\s*(.*)/);
  
  if (match && match.length >= 3) {
    return {
      spaces: match[1],
      unit: match[2].trim()
    };
  }
  
  // If we can't parse it, just return the whole string as spaces
  return {
    spaces: parkingString,
    unit: ""
  };
};

/**
 * Format spaces and unit into a parking requirement string
 * @param spaces Number of spaces
 * @param unit Unit string (e.g., "per unit", "per 1000 SF")
 * @returns Formatted parking requirement string
 */
export const formatParking = (spaces: string, unit: string): string => {
  if (!spaces) return "";
  
  if (!unit) return spaces;
  
  return `${spaces} ${unit}`;
};

/**
 * Get zoning district name from ID
 * @param districtId The zoning district ID
 * @returns The human-readable name of the district
 */
export const getZoningDistrictName = (districtId: string): string => {
  if (!districtId) return '';
  
  // The zoning district ID is typically already a readable name
  // For districts that use codes, we can expand them here
  
  const districtMap: Record<string, string> = {
    'r5': 'R-5: Residential District',
    'r10': 'R-10: Residential District',
    'b1': 'B-1: Neighborhood Business District',
    'b2': 'B-2: Community Business District',
    'i1': 'I-1: Limited Industrial District',
    'i2': 'I-2: Intensive Industrial District',
    // Add more mappings as needed
  };
  
  // Return the mapped name if it exists, otherwise return the ID
  return districtMap[districtId.toLowerCase()] || districtId;
};
