'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId?: string;
  githubRepoUrl?: string;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setError(null);
      const response = await fetch('/api/projects');
      const result = await response.json();
      
      if (result.data) {
        setProjects(result.data);
      } else {
        setProjects(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string): Promise<string> => {
    if (!name.trim()) {
      throw new Error('Project name is required');
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }

    const result = await response.json();
    const projectId = result.data?.id || result.id;
    
    // Refresh projects list after creation
    await fetchProjects();
    
    return projectId;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
  };
}