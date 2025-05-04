
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { jurisdictions, codeVersions } from "@/data/codeData";

interface ProjectSetupStepProps {
  projectData: {
    projectName: string;
    location: string;
    jurisdiction: string;
    codeVersion: string;
    manualAmendments: boolean;
  };
  onProjectDataChange: (field: string, value: string | boolean) => void;
}

const ProjectSetupStep = ({ projectData, onProjectDataChange }: ProjectSetupStepProps) => {
  return (
    <div className="step-container">
      <h2 className="step-title">
        <span className="step-icon">🧭</span> Project Setup
      </h2>
      
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input 
              id="projectName" 
              placeholder="Enter project name" 
              value={projectData.projectName}
              onChange={(e) => onProjectDataChange("projectName", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location (Address or TMK)</Label>
            <Input 
              id="location" 
              placeholder="Enter property address or TMK" 
              value={projectData.location}
              onChange={(e) => onProjectDataChange("location", e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select 
                value={projectData.jurisdiction} 
                onValueChange={(value) => onProjectDataChange("jurisdiction", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map((jurisdiction) => (
                    <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                      {jurisdiction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codeVersion">Code Version</Label>
              <Select 
                value={projectData.codeVersion} 
                onValueChange={(value) => onProjectDataChange("codeVersion", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select code version" />
                </SelectTrigger>
                <SelectContent>
                  {codeVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="manualAmendments" 
              checked={projectData.manualAmendments}
              onCheckedChange={(checked) => onProjectDataChange("manualAmendments", checked)}
            />
            <Label htmlFor="manualAmendments">Manual Amendments</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectSetupStep;
