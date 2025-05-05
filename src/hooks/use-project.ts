
import { useOutletContext } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  project_data: any;
}

interface ProjectContextType {
  currentProject: Project | null;
  updateProjectData: (section: string, data: any) => void;
}

export function useProject(): ProjectContextType {
  return useOutletContext<ProjectContextType>();
}
