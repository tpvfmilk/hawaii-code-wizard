import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProjectSetupStep from "@/components/ProjectSetupStep";
import ZoningInfoStep from "@/components/ZoningInfoStep";
import OccupancyConstruction from "@/components/OccupancyConstruction";
import LifeSafetyStep from "@/components/LifeSafetyStep";
import FireRatingsStep from "@/components/FireRatingsStep";
import SummaryStep from "@/components/SummaryStep";
import WizardNav from "@/components/WizardNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
const Index = () => {
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompletion, setStepCompletion] = useState<boolean[]>([false, false, false, false, false, false]);
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
    parkingRequired: "",
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
  const steps = ["Project Setup", "Zoning & Site", "Occupancy & Construction", "Life Safety / Egress", "Fire Ratings", "Summary"];

  // Handle project data changes
  const handleProjectDataChange = (field: string, value: string | boolean) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle zoning data changes
  const handleZoningDataChange = (field: string, value: string | boolean) => {
    setZoningData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle occupancy data changes
  const handleOccupancyDataChange = (field: string, value: any) => {
    setOccupancyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle life safety data changes
  const handleLifeSafetyDataChange = (field: string, value: string) => {
    setLifeSafetyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle fire data changes
  const handleFireDataChange = (field: string, value: string) => {
    setFireData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

    // Step 4: Life Safety / Egress
    newCompletionStatus[3] = !!lifeSafetyData.occupantLoad && !!lifeSafetyData.exitsRequired;

    // Step 5: Fire Ratings
    newCompletionStatus[4] = !!fireData.fireSeparationDistance;

    // Step 6: Summary is always complete
    newCompletionStatus[5] = true;
    setStepCompletion(newCompletionStatus);
  };

  // Check step completion whenever data changes
  useEffect(() => {
    checkStepCompletion();
  }, [projectData, zoningData, occupancyData, lifeSafetyData, fireData]);

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
  return <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center relative">
          <h1 className="text-3xl font-bold text-primary">Code Sheet Generator</h1>
          <p className="text-gray-600 mt-2">Generate code & zoning summaries for G-Sheets</p>
          
          <Link to="/dashboard" className="absolute right-0 top-0">
            <Button variant="outline" size="sm" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Data Dashboard
            </Button>
          </Link>
        </header>
        
        <Card className="max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">{steps[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {currentStep === 0 && <ProjectSetupStep projectData={projectData} onProjectDataChange={handleProjectDataChange} />}
            
            {currentStep === 1 && <ZoningInfoStep zoningData={zoningData} onZoningDataChange={handleZoningDataChange} jurisdiction={projectData.jurisdiction} onDatasetUploaded={handleDatasetUploaded} />}
            
            {currentStep === 2 && <OccupancyConstruction occupancyData={occupancyData} onOccupancyDataChange={handleOccupancyDataChange} onDatasetUploaded={handleDatasetUploaded} />}
            
            {currentStep === 3 && <LifeSafetyStep lifeSafetyData={lifeSafetyData} onLifeSafetyDataChange={handleLifeSafetyDataChange} onDatasetUploaded={handleDatasetUploaded} occupancyData={{
            primaryOccupancy: occupancyData.primaryOccupancy,
            buildingArea: occupancyData.buildingArea
          }} />}
            
            {currentStep === 4 && <FireRatingsStep fireData={fireData} onFireDataChange={handleFireDataChange} onDatasetUploaded={handleDatasetUploaded} constructionType={occupancyData.constructionType} />}
            
            {currentStep === 5 && <SummaryStep projectData={projectData} zoningData={zoningData} occupancyData={occupancyData} lifeSafetyData={lifeSafetyData} fireData={fireData} />}
            
            <div className="mt-10">
              <WizardNav steps={steps} currentStep={currentStep} onNext={goToNextStep} onPrevious={goToPreviousStep} onStepClick={goToStep} isStepComplete={isStepComplete} />
            </div>
          </CardContent>
        </Card>
        
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Code Sheet Generator © 2025 - References IBC 2018/2021 and local zoning codes</p>
        </footer>
      </div>
    </div>;
};
export default Index;