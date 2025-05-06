
/**
 * Utility functions for matching zoning records
 */

/**
 * Parses a parking requirement string into separate values for spaces and unit
 * Example: "2 / DU" -> { spaces: "2", unit: "DU" }
 */
export function parseParking(parkingString: string | null | undefined): { spaces: string, unit: string } {
  if (!parkingString) return { spaces: "", unit: "" };
  
  // Try to match patterns like "2 / DU", "1.5/DU", "1 per dwelling unit", etc.
  const regex = /^([\d.]+)\s*(?:\/|per)\s*(.+)$/i;
  const match = parkingString.trim().match(regex);
  
  if (match) {
    return {
      spaces: match[1].trim(),
      unit: match[2].trim()
    };
  }
  
  // If no clear pattern, just return the raw value as spaces and empty unit
  return {
    spaces: parkingString,
    unit: ""
  };
}

/**
 * Formats parking requirements back into a string
 */
export function formatParking(spaces: string, unit: string): string {
  if (!spaces) return "";
  if (!unit) return spaces;
  return `${spaces} / ${unit}`;
}

/**
 * Performs a detailed comparison between a frontend zoning district ID and backend records
 * to find why matches might be failing
 */
export function findZoningMatchWithDebug(
  dataset: any[], 
  jurisdiction: string,
  zoningDistrictId: string
): { match: any | null; debugInfo: any } {
  // Create debug info object
  const debugInfo = {
    attemptedMatch: zoningDistrictId,
    jurisdictionCheck: {
      frontendValue: jurisdiction?.toLowerCase(),
      datasetValues: dataset.map(item => item.county?.toLowerCase()).filter((v, i, a) => a.indexOf(v) === i)
    },
    districtCheck: {
      frontendValue: zoningDistrictId?.toLowerCase(),
      exactMatches: [] as string[],
      partialMatches: [] as string[],
      allValues: [] as string[]
    },
    matchAttempts: [] as any[]
  };

  // No dataset or empty search - early return
  if (!dataset || dataset.length === 0 || !zoningDistrictId) {
    return { match: null, debugInfo };
  }

  // Collect all zoning district values from dataset for debugging
  dataset.forEach(item => {
    const district = item.zoning_district;
    if (district) {
      debugInfo.districtCheck.allValues.push(district);
      
      // Check for exact match (case insensitive)
      if (district.toLowerCase() === zoningDistrictId.toLowerCase()) {
        debugInfo.districtCheck.exactMatches.push(district);
      }
      // Check for partial match (district contains the ID or ID contains the district)
      else if (
        district.toLowerCase().includes(zoningDistrictId.toLowerCase()) ||
        zoningDistrictId.toLowerCase().includes(district.toLowerCase())
      ) {
        debugInfo.districtCheck.partialMatches.push(district);
      }
    }
  });

  // Try to find a match using both jurisdiction and district
  for (const item of dataset) {
    const itemCounty = item.county?.toLowerCase();
    const itemDistrict = item.zoning_district?.toLowerCase();
    const searchJurisdiction = jurisdiction?.toLowerCase();
    const searchDistrict = zoningDistrictId?.toLowerCase();

    const countyMatch = itemCounty === searchJurisdiction;
    const districtMatch = itemDistrict === searchDistrict;
    
    // Log each comparison attempt
    debugInfo.matchAttempts.push({
      record: {
        county: item.county,
        district: item.zoning_district,
        parking: item.parking_required
      },
      comparison: {
        countyMatch,
        districtMatch,
        countyComparison: `'${itemCounty}' === '${searchJurisdiction}'`,
        districtComparison: `'${itemDistrict}' === '${searchDistrict}'`
      }
    });

    // Return on exact match
    if (countyMatch && districtMatch) {
      return { match: item, debugInfo };
    }
  }

  // No match found
  return { match: null, debugInfo };
}

/**
 * A direct matcher without extra debug info, for production use
 */
export function findZoningMatch(dataset: any[], jurisdiction: string, zoningDistrictId: string): any | null {
  if (!dataset || dataset.length === 0 || !zoningDistrictId) {
    return null;
  }

  return dataset.find(item => 
    item.county?.toLowerCase() === jurisdiction?.toLowerCase() && 
    item.zoning_district?.toLowerCase() === zoningDistrictId?.toLowerCase()
  );
}
