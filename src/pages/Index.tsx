
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProjectSetupStep from "@/components/ProjectSetupStep";
import ZoningInfoStep from "@/components/ZoningInfoStep";
import OccupancyConstruction from "@/components/OccupancyConstruction";
import ParkingCalculationStep from "@/components/ParkingCalculationStep";
import LifeSafetyStep from "@/components/LifeSafetyStep";
import FireRatingsStep from "@/components/FireRatingsStep";
import SummaryStep from "@/components/SummaryStep";
import WizardNav from "@/components/WizardNav";
import { FileCode } from "lucide-react";
import { useProject } from "@/hooks/use-project";

const Index = () => {
  const { toast } = useToast();
  const { currentProject, updateProjectData } = useProject();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompletion, setStepCompletion] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [datasets, setDatasets] = useState<{
    [key: string]: any[];
  }>({});

  // Project data state
  const [projectData, setProjectData] = useState({
    projectName: "",
    location: "",
    jurisdiction: "",
    codeVersion: "",
    manualAmendments: false
  });

  // Zoning data state
  const [zoningData, setZoningData] = useState({
    zoningDistrict: "",
    lotArea: "",
    setbacks: "",
    far: "",
    maxHeight: "",
    lotCoverage: "",
    parkingSpaces: "",  // Changed from parkingRequired
    parkingUnit: "",    // Added for parking unit 
    adaParking: "",
    isSMA: false,
    isFloodZone: false,
    isLavaZone: false,
    isHistoricDistrict: false
  });

  // Occupancy data state
  const [occupancyData, setOccupancyData] = useState({
    primaryOccupancy: "",
    secondaryOccupancies: [] as string[],
    mixedOccupancyType: "separated",
    constructionType: "",
    stories: "",
    buildingHeight: "",
    buildingArea: "",
    sprinklered: false
  });

  // Parking data state
  const [parkingData, setParkingData] = useState({
    occupancyType: "",
    buildingArea: "",
    calculatedSpaces: 0,
    manualOverride: ""
  });

  // Life safety data state
  const [lifeSafetyData, setLifeSafetyData] = useState({
    occupantLoad: "",
    travelDistance: "",
    commonPath: "",
    deadEndCorridors: "",
    exitsRequired: "",
    exitWidths: "",
    corridorSize: "",
    exitDischargeDistance: ""
  });

  // Fire ratings data state
  const [fireData, setFireData] = useState({
    fireSeparationDistance: "",
    exteriorWallRating: "",
    openingProtection: "",
    shaftEnclosures: "",
    doorWindowRatings: ""
  });
  
  const steps = ["Project Setup", "Zoning & Site", "Occupancy & Construction", "Parking Calculation", "Life Safety / Egress", "Fire Ratings", "Summary"];

  // Handle project data changes
  const handleProjectDataChange = (field: string, value: string | boolean) => {
    setProjectData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("projectData", newData);
      return newData;
    });
  };

  // Handle zoning data changes
  const handleZoningDataChange = (field: string, value: string | boolean) => {
    setZoningData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("zoningData", newData);
      return newData;
    });
  };

  // Handle occupancy data changes
  const handleOccupancyDataChange = (field: string, value: any) => {
    setOccupancyData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("occupancyData", newData);
      return newData;
    });
  };

  // Handle parking data changes
  const handleParkingDataChange = (field: string, value: any) => {
    setParkingData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("parkingData", newData);
      return newData;
    });
  };

  // Handle life safety data changes
  const handleLifeSafetyDataChange = (field: string, value: string) => {
    setLifeSafetyData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("lifeSafetyData", newData);
      return newData;
    });
  };

  // Handle fire data changes
  const handleFireDataChange = (field: string, value: string) => {
    setFireData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      updateProjectData("fireData", newData);
      return newData;
    });
  };

  // Load project data from context if available
  useEffect(() => {
    if (currentProject?.project_data) {
      const { projectData: pd, zoningData: zd, occupancyData: od, parkingData: pkd, lifeSafetyData: lsd, fireData: fd } = currentProject.project_data;
      
      if (pd) setProjectData(prev => ({ ...prev, ...pd }));
      if (zd) setZoningData(prev => ({ ...prev, ...zd }));
      if (od) setOccupancyData(prev => ({ ...prev, ...od }));
      if (pkd) setParkingData(prev => ({ ...prev, ...pkd }));
      if (lsd) setLifeSafetyData(prev => ({ ...prev, ...lsd }));
      if (fd) setFireData(prev => ({ ...prev, ...fd }));
      
      // Set project name from current project
      if (currentProject.name && !pd?.projectName) {
        setProjectData(prev => {
          const newData = { ...prev, projectName: currentProject.name };
          updateProjectData("projectData", newData);
          return newData;
        });
      }
    }
  }, [currentProject]);

  // Handle dataset uploads
  const handleDatasetUploaded = (datasetType: string, data: any[]) => {
    setDatasets(prev => ({
      ...prev,
      [datasetType]: data
    }));
    toast({
      title: "Dataset Uploaded",
      description: `The ${datasetType} data has been successfully loaded.`
    });
  };

  // Check if the current step is complete
  const checkStepCompletion = () => {
    const newCompletionStatus = [...stepCompletion];

    // Step 1: Project Setup
    newCompletionStatus[0] = !!projectData.projectName && !!projectData.location && !!projectData.jurisdiction && !!projectData.codeVersion;

    // Step 2: Zoning & Site
    newCompletionStatus[1] = !!zoningData.zoningDistrict && !!zoningData.lotArea;

    // Step 3: Occupancy & Construction
    newCompletionStatus[2] = !!occupancyData.primaryOccupancy && !!occupancyData.constructionType && !!occupancyData.stories && !!occupancyData.buildingHeight && !!occupancyData.buildingArea;

    // Step 4: Parking Calculation
    newCompletionStatus[3] = true; // Always complete since it's calculated based on previous steps

    // Step 5: Life Safety / Egress
    newCompletionStatus[4] = !!lifeSafetyData.occupantLoad && !!lifeSafetyData.exitsRequired;

    // Step 6: Fire Ratings
    newCompletionStatus[5] = !!fireData.fireSeparationDistance;

    // Step 7: Summary is always complete
    newCompletionStatus[6] = true;
    setStepCompletion(newCompletionStatus);
  };

  // Check step completion whenever data changes
  useEffect(() => {
    checkStepCompletion();
  }, [projectData, zoningData, occupancyData, parkingData, lifeSafetyData, fireData]);

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Navigate to specific step
  const goToStep = (step: number) => {
    // Only allow navigation to completed steps or the next incomplete step
    if (step < currentStep || stepCompletion[step - 1] || step === 0) {
      setCurrentStep(step);
    } else {
      toast({
        title: "Complete Current Step",
        description: "Please complete the current step before proceeding.",
        variant: "destructive"
      });
    }
  };

  // Check if a step is complete
  const isStepComplete = (step: number) => {
    return stepCompletion[step];
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center relative">
          <div className="flex items-center justify-center mb-2">
            <FileCode className="h-8 w-8 mr-2 text-primary" />
            <h1 className="modern-heading text-primary">Code Sheet Generator</h1>
          </div>
          <p className="modern-subheading mt-2">Generate comprehensive code & zoning summaries for your projects</p>
          
          <div className="absolute right-0 top-0">
            {currentProject && (
              <div className="text-sm text-muted-foreground">
                Working on: <span className="font-medium">{currentProject.name}</span>
              </div>
            )}
          </div>
        </header>
        
        <Card className="max-w-5xl mx-auto modern-card overflow-hidden">
          <CardHeader className="bg-secondary/50 border-b">
            <CardTitle className="text-xl">{steps[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            {currentStep === 0 && <ProjectSetupStep projectData={projectData} onProjectDataChange={handleProjectDataChange} />}
            
            {currentStep === 1 && <ZoningInfoStep zoningData={zoningData} onZoningDataChange={handleZoningDataChange} jurisdiction={projectData.jurisdiction} onDatasetUploaded={handleDatasetUploaded} />}
            
            {currentStep === 2 && <OccupancyConstruction occupancyData={occupancyData} onOccupancyDataChange={handleOccupancyDataChange} onDatasetUploaded={handleDatasetUploaded} />}
            
            {currentStep === 3 && <ParkingCalculationStep 
              parkingData={parkingData} 
              onParkingDataChange={handleParkingDataChange}
              occupancyData={{
                primaryOccupancy: occupancyData.primaryOccupancy,
                buildingArea: occupancyData.buildingArea
              }}
            />}
            
            {currentStep === 4 && <LifeSafetyStep lifeSafetyData={lifeSafetyData} onLifeSafetyDataChange={handleLifeSafetyDataChange} onDatasetUploaded={handleDatasetUploaded} occupancyData={{
            primaryOccupancy: occupancyData.primaryOccupancy,
            buildingArea: occupancyData.buildingArea
          }} />}
            
            {currentStep === 5 && <FireRatingsStep fireData={fireData} onFireDataChange={handleFireDataChange} onDatasetUploaded={handleDatasetUploaded} constructionType={occupancyData.constructionType} />}
            
            {currentStep === 6 && <SummaryStep projectData={projectData} zoningData={zoningData} occupancyData={occupancyData} parkingData={parkingData} lifeSafetyData={lifeSafetyData} fireData={fireData} />}
            
            <div className="mt-10">
              <WizardNav steps={steps} currentStep={currentStep} onNext={goToNextStep} onPrevious={goToPreviousStep} onStepClick={goToStep} isStepComplete={isStepComplete} />
            </div>
          </CardContent>
        </Card>
        
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Code Sheet Generator © 2025 - References IBC 2018/2021 and local zoning codes</p>
        </footer>
      </div>
    </div>
  );
};
export default Index;
