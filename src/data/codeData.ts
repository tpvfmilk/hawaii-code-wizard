
export const jurisdictions = [
  { id: "honolulu", name: "Honolulu" },
  { id: "hawaii_county", name: "Hawaiʻi County" }
];

export const codeVersions = [
  { id: "ibc_2018", name: "IBC 2018" },
  { id: "ibc_2021", name: "IBC 2021" }
];

export interface ZoningDistrict {
  id: string;
  name: string;
  jurisdiction: string;
}

export const zoningDistricts: ZoningDistrict[] = [
  // Honolulu districts
  { id: "r-3.5", name: "R-3.5 Residential", jurisdiction: "honolulu" },
  { id: "r-5", name: "R-5 Residential", jurisdiction: "honolulu" },
  { id: "r-7.5", name: "R-7.5 Residential", jurisdiction: "honolulu" },
  { id: "r-10", name: "R-10 Residential", jurisdiction: "honolulu" },
  { id: "amt", name: "AMX-1 Apartment Mixed Use", jurisdiction: "honolulu" },
  { id: "bmd-3", name: "BMX-3 Community Business Mixed Use", jurisdiction: "honolulu" },
  { id: "bmd-4", name: "BMX-4 Central Business Mixed Use", jurisdiction: "honolulu" },
  
  // Hawaii County districts
  { id: "rs", name: "RS Residential", jurisdiction: "hawaii_county" },
  { id: "rm", name: "RM Multiple-Family Residential", jurisdiction: "hawaii_county" },
  { id: "cv", name: "CV Village Commercial", jurisdiction: "hawaii_county" },
  { id: "cg", name: "CG General Commercial", jurisdiction: "hawaii_county" },
  { id: "ml", name: "ML Limited Industrial", jurisdiction: "hawaii_county" },
  { id: "mg", name: "MG General Industrial", jurisdiction: "hawaii_county" }
];

export const counties = [
  { id: "honolulu", name: "City and County of Honolulu" },
  { id: "hawaii", name: "Hawaiʻi County" },
  { id: "maui", name: "Maui County" },
  { id: "kauai", name: "Kauaʻi County" }
];

export const occupancyGroups = [
  // Assembly (Group A)
  { id: "a1", name: "A-1: Assembly (Fixed Seating, Theaters)" },
  { id: "a2", name: "A-2: Assembly (Food & Drink Consumption)" },
  { id: "a3", name: "A-3: Assembly (Worship, Recreation)" },
  { id: "a4", name: "A-4: Assembly (Indoor Sporting Events)" },
  { id: "a5", name: "A-5: Assembly (Outdoor Sporting Events)" },
  
  // Business (Group B)
  { id: "b", name: "B: Business (Offices, Banks, Clinics)" },
  
  // Educational (Group E)
  { id: "e1", name: "E-1: Educational (Children Under 2.5 Years)" },
  { id: "e2", name: "E-2: Educational (Children Over 2.5 Years)" },
  
  // Factory and Industrial (Group F)
  { id: "f1", name: "F-1: Factory (Moderate Hazard)" },
  { id: "f2", name: "F-2: Factory (Low Hazard)" },
  
  // High Hazard (Group H)
  { id: "h1", name: "H-1: High Hazard (Explosives)" },
  { id: "h2", name: "H-2: High Hazard (Combustible/Toxic Materials)" },
  { id: "h3", name: "H-3: High Hazard (Physical Hazards)" },
  { id: "h4", name: "H-4: High Hazard (Health Hazards)" },
  { id: "h5", name: "H-5: High Hazard (Semiconductor Fabrication)" },
  
  // Institutional (Group I)
  { id: "i1", name: "I-1: Institutional (Residential Care)" },
  { id: "i2", name: "I-2: Institutional (Medical Care)" },
  { id: "i3", name: "I-3: Institutional (Detention Facilities)" },
  { id: "i4", name: "I-4: Institutional (Day Care)" },
  
  // Mercantile (Group M)
  { id: "m", name: "M: Mercantile (Retail, Department Stores)" },
  
  // Residential (Group R)
  { id: "r1", name: "R-1: Residential (Transient)" },
  { id: "r2", name: "R-2: Residential (Permanent, 3+ Units)" },
  { id: "r3", name: "R-3: Residential (1-2 Units)" },
  { id: "r4", name: "R-4: Residential (Small Dormitories)" },
  
  // Storage (Group S)
  { id: "s1", name: "S-1: Storage (Moderate Hazard)" },
  { id: "s2", name: "S-2: Storage (Low Hazard)" },
  
  // Utility (Group U)
  { id: "u", name: "U: Utility & Miscellaneous" },
];

export const constructionTypes = [
  { id: "ia", name: "I-A: Type I-A" },
  { id: "ib", name: "I-B: Type I-B" },
  { id: "iia", name: "II-A: Type II-A" },
  { id: "iib", name: "II-B: Type II-B" },
  { id: "iiia", name: "III-A: Type III-A" },
  { id: "iiib", name: "III-B: Type III-B" },
  { id: "iva", name: "IV-A: Type IV-A" },
  { id: "ivb", name: "IV-B: Type IV-B" },
  { id: "ivc", name: "IV-C: Type IV-C" },
  { id: "va", name: "V-A: Type V-A" },
  { id: "vb", name: "V-B: Type V-B" }
];

export const requiredDatasets = {
  zoning: {
    name: "Zoning Data",
    requiredColumns: ["District", "Setbacks", "FAR", "Height", "Coverage"],
    prompt: "Zoning data not available for this district. Please upload CSV with columns: District, Setbacks, FAR, Height, Coverage."
  },
  heightLimits: {
    name: "IBC Table 504.3 (Height Limits)",
    requiredColumns: ["OccupancyGroup", "Type_IA", "Type_IB", "Type_IIA", "Type_IIB", "Type_IIIA", "Type_IIIB", "Type_IV", "Type_VA", "Type_VB"],
    prompt: "IBC height limits unavailable. Please upload CSV for Table 504.3."
  },
  storyLimits: {
    name: "IBC Table 504.4 (Story Limits)",
    requiredColumns: ["OccupancyGroup", "Type_IA", "Type_IB", "Type_IIA", "Type_IIB", "Type_IIIA", "Type_IIIB", "Type_IV", "Type_VA", "Type_VB"],
    prompt: "IBC story limits unavailable. Please upload CSV for Table 504.4."
  },
  areaLimits: {
    name: "IBC Table 506.2 (Area Limits)",
    requiredColumns: ["OccupancyGroup", "Type_IA", "Type_IB", "Type_IIA", "Type_IIB", "Type_IIIA", "Type_IIIB", "Type_IV", "Type_VA", "Type_VB"],
    prompt: "IBC area limits unavailable. Please upload CSV for Table 506.2."
  },
  egressRequirements: {
    name: "IBC Egress Tables",
    requiredColumns: ["OccupancyGroup", "MinExits", "MaxOccupantLoad", "MaxTravelDistance"],
    prompt: "Egress table not found. Please upload CSVs for IBC 1006.2.1, 1006.3.1, 1006.3.2(1), and 1027.6."
  },
  fireRatings: {
    name: "IBC Fire Rating Tables",
    requiredColumns: ["ConstructionType", "ExteriorWalls", "StructuralFrame", "BearingWalls", "FloorConstruction", "RoofConstruction"],
    prompt: "Fire resistance ratings unavailable. Upload CSVs for Tables 602, 705.8, or 713.4."
  },
  parkingRequirements: {
    name: "Parking Requirements",
    requiredColumns: ["County", "UseType", "ParkingRatio"],
    prompt: "Parking requirements unavailable. Please upload CSV with parking ratios by use type."
  }
};

export interface CSVUploadConfig {
  type: string;
  title: string;
  description: string;
  requiredColumns: string[];
}
