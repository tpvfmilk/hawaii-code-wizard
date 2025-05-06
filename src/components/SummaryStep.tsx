import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { occupancyGroups, constructionTypes } from "@/data/codeData";
import { downloadAsCSV } from "@/utils/CSVHelper";
import { toast } from "@/hooks/use-toast";

interface SummaryStepProps {
  projectData: any;
  zoningData: any;
  occupancyData: any;
  lifeSafetyData: any;
  fireData: any;
}

const SummaryStep = ({ 
  projectData, 
  zoningData, 
  occupancyData, 
  lifeSafetyData, 
  fireData 
}: SummaryStepProps) => {
  const getOccupancyName = (id: string) => {
    const group = occupancyGroups.find(g => g.id === id);
    return group ? group.name : id;
  };
  
  const getConstructionTypeName = (id: string) => {
    const type = constructionTypes.find(t => t.id === id);
    return type ? type.name : id;
  };
  
  const getZoningName = (id: string) => {
    // Instead of using the hardcoded zoningDistricts array, just return the ID
    // This will display the zoning district ID directly, which is likely its name anyway
    return id;
  };
  
  const exportToCSV = () => {
    // Combine all data into a single flattened object
    const summaryData = [
      {
        ...projectData,
        ...zoningData,
        ...occupancyData,
        ...lifeSafetyData,
        ...fireData,
        primaryOccupancyName: getOccupancyName(occupancyData.primaryOccupancy),
        constructionTypeName: getConstructionTypeName(occupancyData.constructionType),
        zoningDistrictName: getZoningName(zoningData.zoningDistrict)
      }
    ];
    
    downloadAsCSV(summaryData, `${projectData.projectName}-code-summary`);
    
    toast({
      title: "Export Complete",
      description: "The code summary has been exported as a CSV file."
    });
  };
  
  const copyToClipboard = (tabName: string) => {
    let textToCopy = "";
    
    switch(tabName) {
      case "code":
        textToCopy = `CODE SUMMARY - ${projectData.projectName}
Location: ${projectData.location}
Jurisdiction: ${projectData.jurisdiction}
Code Version: ${projectData.codeVersion}

OCCUPANCY:
Primary: ${getOccupancyName(occupancyData.primaryOccupancy)}
Construction Type: ${getConstructionTypeName(occupancyData.constructionType)}
Building Height: ${occupancyData.buildingHeight} ft (${occupancyData.stories} stories)
Building Area: ${occupancyData.buildingArea} sf
Sprinklered: ${occupancyData.sprinklered ? "Yes" : "No"}`;
        break;
      
      case "zoning":
        textToCopy = `ZONING SUMMARY - ${projectData.projectName}
Zoning District: ${getZoningName(zoningData.zoningDistrict)}
Lot Area: ${zoningData.lotArea} sf
Setbacks: ${zoningData.setbacks}
FAR: ${zoningData.far}
Max Height: ${zoningData.maxHeight} ft
Lot Coverage: ${zoningData.lotCoverage}%
Parking Required: ${zoningData.parkingRequired} spaces (${zoningData.adaParking} ADA)
Special Conditions: ${zoningData.isSMA ? "SMA, " : ""}${zoningData.isFloodZone ? "Flood Zone, " : ""}${zoningData.isLavaZone ? "Lava Zone, " : ""}${zoningData.isHistoricDistrict ? "Historic District" : ""}`;
        break;
      
      case "egress":
        textToCopy = `EGRESS SUMMARY - ${projectData.projectName}
Occupant Load: ${lifeSafetyData.occupantLoad}
Exits Required: ${lifeSafetyData.exitsRequired}
Max Travel Distance: ${lifeSafetyData.travelDistance} ft
Common Path: ${lifeSafetyData.commonPath} ft
Dead-End Corridors: ${lifeSafetyData.deadEndCorridors} ft
Exit Widths: ${lifeSafetyData.exitWidths}
Corridor/Stair Sizes: ${lifeSafetyData.corridorSize}
Exit Discharge: ${lifeSafetyData.exitDischargeDistance} ft`;
        break;
      
      case "fire":
        textToCopy = `FIRE RATING SUMMARY - ${projectData.projectName}
Fire Separation Distance: ${fireData.fireSeparationDistance} ft
Exterior Wall Rating: ${fireData.exteriorWallRating} hour(s)
Opening Protection: ${fireData.openingProtection}
Shaft Enclosures: ${fireData.shaftEnclosures}
Door and Window Ratings: ${fireData.doorWindowRatings}`;
        break;
    }
    
    navigator.clipboard.writeText(textToCopy);
    
    toast({
      title: "Copied to Clipboard",
      description: `The ${tabName} summary has been copied to your clipboard.`
    });
  };
  
  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">📋</span> Summary
      </h2>
      
      <Tabs defaultValue="code">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="code">Code Summary</TabsTrigger>
          <TabsTrigger value="zoning">Zoning</TabsTrigger>
          <TabsTrigger value="egress">Egress</TabsTrigger>
          <TabsTrigger value="fire">Fire Ratings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">Project & Code Information</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Project Name</TableCell>
                <TableCell>{projectData.projectName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Location</TableCell>
                <TableCell>{projectData.location}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jurisdiction</TableCell>
                <TableCell>{projectData.jurisdiction}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Code Version</TableCell>
                <TableCell>{projectData.codeVersion}</TableCell>
              </TableRow>
            </TableBody>
            
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">Occupancy & Construction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Primary Occupancy</TableCell>
                <TableCell>{getOccupancyName(occupancyData.primaryOccupancy)}</TableCell>
              </TableRow>
              {occupancyData.secondaryOccupancies.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium">Secondary Occupancies</TableCell>
                  <TableCell>
                    {occupancyData.secondaryOccupancies.map(getOccupancyName).join(", ")}
                    <br />
                    <span className="text-sm text-gray-500">
                      Mixed Occupancy: {occupancyData.mixedOccupancyType}
                    </span>
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">Construction Type</TableCell>
                <TableCell>{getConstructionTypeName(occupancyData.constructionType)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Building Height</TableCell>
                <TableCell>{occupancyData.buildingHeight} ft ({occupancyData.stories} stories)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Building Area</TableCell>
                <TableCell>{occupancyData.buildingArea} sf</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Sprinklered</TableCell>
                <TableCell>{occupancyData.sprinklered ? "Yes" : "No"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard("code")}
            >
              Copy to Clipboard
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="zoning" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">Zoning & Site Information</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Zoning District</TableCell>
                <TableCell>{getZoningName(zoningData.zoningDistrict)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Lot Area</TableCell>
                <TableCell>{zoningData.lotArea} sf</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Setbacks</TableCell>
                <TableCell>{zoningData.setbacks}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">FAR</TableCell>
                <TableCell>{zoningData.far}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Max Height</TableCell>
                <TableCell>{zoningData.maxHeight} ft</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Lot Coverage</TableCell>
                <TableCell>{zoningData.lotCoverage}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Parking Requirements</TableCell>
                <TableCell>
                  {zoningData.parkingRequired} spaces required
                  <br />
                  <span className="text-sm text-gray-500">
                    Including {zoningData.adaParking} ADA spaces
                  </span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Special Conditions</TableCell>
                <TableCell>
                  {zoningData.isSMA && <div>SMA (Shoreline Management Area)</div>}
                  {zoningData.isFloodZone && <div>Flood Zone</div>}
                  {zoningData.isLavaZone && <div>Lava Zone</div>}
                  {zoningData.isHistoricDistrict && <div>Historic District</div>}
                  {!zoningData.isSMA && !zoningData.isFloodZone && !zoningData.isLavaZone && !zoningData.isHistoricDistrict && "None"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard("zoning")}
            >
              Copy to Clipboard
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="egress" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">Life Safety & Egress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Occupant Load</TableCell>
                <TableCell>{lifeSafetyData.occupantLoad}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exits Required</TableCell>
                <TableCell>{lifeSafetyData.exitsRequired}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Max Travel Distance</TableCell>
                <TableCell>{lifeSafetyData.travelDistance} ft</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Common Path</TableCell>
                <TableCell>{lifeSafetyData.commonPath} ft</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dead-End Corridors</TableCell>
                <TableCell>{lifeSafetyData.deadEndCorridors} ft</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exit Widths</TableCell>
                <TableCell>{lifeSafetyData.exitWidths}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Corridor/Stair Sizes</TableCell>
                <TableCell>{lifeSafetyData.corridorSize}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exit Discharge</TableCell>
                <TableCell>{lifeSafetyData.exitDischargeDistance} ft</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard("egress")}
            >
              Copy to Clipboard
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="fire" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">Fire Ratings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Fire Separation Distance</TableCell>
                <TableCell>{fireData.fireSeparationDistance} ft</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exterior Wall Rating</TableCell>
                <TableCell>{fireData.exteriorWallRating} hour(s)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Opening Protection</TableCell>
                <TableCell>{fireData.openingProtection}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Shaft/Vertical Openings</TableCell>
                <TableCell>{fireData.shaftEnclosures}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Door and Window Ratings</TableCell>
                <TableCell>{fireData.doorWindowRatings}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard("fire")}
            >
              Copy to Clipboard
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="secondary"
          onClick={() => {
            // Print functionality
            window.print();
          }}
        >
          Print Summary
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
          >
            Export to CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // PDF export would be implemented here
              toast({
                title: "PDF Export",
                description: "PDF export functionality would be implemented here."
              });
            }}
          >
            Export to PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SummaryStep;
