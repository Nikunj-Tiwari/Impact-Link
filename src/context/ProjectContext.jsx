import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchProjects } from '../services/api';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjects();
      setProjects(data);
      // Auto-select Global project if available
      if (data.length > 0 && !currentProject) {
        const globalProj = data.find(p => p.scope === 'Global') || data[0];
        setCurrentProject(globalProj);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const switchProject = (projectId) => {
    const proj = projects.find(p => p._id === projectId);
    if (proj) setCurrentProject(proj);
  };

  return (
    <ProjectContext.Provider value={{ projects, currentProject, switchProject, refreshProjects: loadProjects, loading }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
