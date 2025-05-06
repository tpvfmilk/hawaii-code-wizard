
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ProjectSidebar from "@/components/ProjectSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define project interface
interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  project_data: any;
}

const AppLayout = () => {
  const { toast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectData, setProjectData] = useState<any>({
    projectData: {},
    zoningData: {},
    occupancyData: {},
    parkingData: {},
    lifeSafetyData: {},
    fireData: {}
  });

  // Save project data to state for potential saving
  const updateProjectData = (section: string, data: any) => {
    setProjectData((prev: any) => ({
      ...prev,
      [section]: data
    }));
  };

  // Auto-save project data when it changes
  useEffect(() => {
    const saveProjectData = async () => {
      if (currentProject && Object.keys(projectData).length > 0) {
        try {
          await supabase
            .from("projects")
            .update({
              project_data: projectData,
              updated_at: new Date().toISOString()
            })
            .eq("id", currentProject.id);
        } catch (error: any) {
          console.error("Error saving project data:", error.message);
        }
      }
    };

    // Debounce save to avoid too many calls
    const debounceTimer = setTimeout(() => {
      saveProjectData();
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [projectData, currentProject]);

  return (
    <SidebarProvider defaultOpen={true} open={true}>
      <div className="flex min-h-screen w-full">
        <ProjectSidebar 
          currentProject={currentProject} 
          setCurrentProject={setCurrentProject}
          projectData={projectData}
        />
        <SidebarInset>
          <Outlet context={{ 
            currentProject, 
            updateProjectData
          }} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
