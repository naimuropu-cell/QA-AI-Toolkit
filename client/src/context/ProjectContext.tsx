import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import { api } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  refreshProjects: () => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      setProjects(res.projects);

      const savedProjectId = localStorage.getItem('qa_toolkit_active_project_id');
      if (savedProjectId && res.projects.length > 0) {
        const found = res.projects.find((p) => p.id === savedProjectId);
        if (found) {
          setActiveProjectState(found);
        } else {
          setActiveProjectState(res.projects[0]);
          localStorage.setItem('qa_toolkit_active_project_id', res.projects[0].id);
        }
      } else if (res.projects.length > 0) {
        setActiveProjectState(res.projects[0]);
        localStorage.setItem('qa_toolkit_active_project_id', res.projects[0].id);
      } else {
        setActiveProjectState(null);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem('qa_toolkit_active_project_id', project.id);
    } else {
      localStorage.removeItem('qa_toolkit_active_project_id');
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        refreshProjects,
        setActiveProject,
        isCreateModalOpen,
        setIsCreateModalOpen,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
