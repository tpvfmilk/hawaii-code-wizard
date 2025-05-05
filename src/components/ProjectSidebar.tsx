import React, { useEffect, useState } from "react";
import { Plus, Folder, Edit, Trash, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  project_data: any;
}

interface ProjectSidebarProps {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projectData: any;
}

const ProjectSidebar = ({ currentProject, setCurrentProject, projectData }: ProjectSidebarProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive"
      });
      return;
    }

    try {
      // First mark all projects as not active
      await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("is_active", true);

      // Create the new project
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProjectName,
          project_data: projectData || {},
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created",
        description: `"${newProjectName}" has been created`
      });
      
      setNewProjectName("");
      setIsCreatingProject(false);
      
      if (data) {
        setCurrentProject(data);
      }
      
      await fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Update project name
  const updateProject = async () => {
    if (!editingProject || !editingProject.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({ name: editingProject.name })
        .eq("id", editingProject.id);

      if (error) throw error;

      toast({
        title: "Project updated",
        description: `Project name has been updated to "${editingProject.name}"`
      });
      
      setEditingProject(null);
      await fetchProjects();
      
      if (currentProject && currentProject.id === editingProject.id) {
        setCurrentProject({
          ...currentProject,
          name: editingProject.name
        });
      }
    } catch (error: any) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete a project
  const deleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: `"${project.name}" has been deleted`
      });
      
      if (currentProject && currentProject.id === project.id) {
        setCurrentProject(null);
      }
      
      await fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Select a project
  const selectProject = async (project: Project) => {
    try {
      // Update current project to save any changes
      if (currentProject) {
        await supabase
          .from("projects")
          .update({
            project_data: projectData,
            is_active: false
          })
          .eq("id", currentProject.id);
      }

      // Mark the selected project as active
      const { data, error } = await supabase
        .from("projects")
        .update({ is_active: true })
        .eq("id", project.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentProject(data);
        toast({
          title: "Project loaded",
          description: `"${data.name}" has been loaded`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error selecting project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Load initial active project
  useEffect(() => {
    const loadActiveProject = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCurrentProject(data);
        }
      } catch (error: any) {
        console.error("Error loading active project:", error.message);
      }
    };

    loadActiveProject();
    fetchProjects();
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <h3 className="text-lg font-semibold">Projects</h3>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No projects found</div>
              ) : (
                projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton 
                      isActive={currentProject?.id === project.id}
                      onClick={() => selectProject(project)}
                      tooltip={project.name}
                    >
                      <Folder className="shrink-0" />
                      <span>{project.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction 
                      onClick={() => setEditingProject(project)}
                      showOnHover
                    >
                      <Edit size={16} />
                    </SidebarMenuAction>
                    <SidebarMenuAction 
                      onClick={() => deleteProject(project)}
                      showOnHover
                    >
                      <Trash size={16} />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Dialog open={isCreatingProject} onOpenChange={setIsCreatingProject}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex justify-center items-center gap-2">
                <Plus size={16} /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={createProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project Name</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input 
                  value={editingProject?.name || ''} 
                  onChange={(e) => setEditingProject(prev => prev ? {...prev, name: e.target.value} : null)}
                  placeholder="Enter project name"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={updateProject}>Update</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="secondary" 
            className="w-full mt-2 flex justify-center items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <Settings size={16} /> Data Dashboard
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ProjectSidebar;
