'use client';

import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId: string;
  githubRepoUrl?: string;
}

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  fetchProject: (id: string) => Promise<void>;
}

export function useProject(projectId?: string): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found');
        } else if (response.status === 401) {
          setError('Authentication required');
        } else {
          setError('Failed to load project');
        }
        return;
      }
      
      const result = await response.json();
      
      if (result.data) {
        setProject(result.data);
      } else {
        setProject(result);
      }
    } catch (err) {
      setError('Failed to load project');
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  return {
    project,
    loading,
    error,
    fetchProject,
  };
}