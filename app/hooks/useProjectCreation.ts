"use client";

import { useState, useCallback } from "react";

interface ProgressStep {
  id: string;
  message: string;
  status: "pending" | "in_progress" | "completed" | "error";
}

interface UseProjectCreationReturn {
  isCreating: boolean;
  progress: ProgressStep[];
  error: string | null;
  createProjectWithStream: (name: string, version?: string) => Promise<string>;
  resetCreation: () => void;
}

export function useProjectCreation(): UseProjectCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createProjectWithStream = useCallback(
    async (name: string, version: string = "latest"): Promise<string> => {
      if (!name.trim()) {
        throw new Error("Project name is required");
      }

      setIsCreating(true);
      setError(null);
      setProgress([]);

      return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
          name: name.trim(),
          version: version,
        });
        const eventSource = new EventSource(
          `/api/projects/create-stream?${params.toString()}`,
        );

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "progress") {
            setProgress((prev) => {
              const newProgress = [...prev];
              const existingIndex = newProgress.findIndex(
                (step) => step.id === data.step.id,
              );

              if (existingIndex >= 0) {
                newProgress[existingIndex] = data.step;
              } else {
                newProgress.push(data.step);
              }

              return newProgress;
            });
          } else if (data.type === "success") {
            eventSource.close();
            setIsCreating(false);
            resolve(data.projectId);
          } else if (data.type === "error") {
            eventSource.close();
            setIsCreating(false);
            setError(data.message);
            reject(new Error(data.message));
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setIsCreating(false);
          const errorMessage = "Connection to server lost. Please try again.";
          setError(errorMessage);
          reject(new Error(errorMessage));
        };
      });
    },
    [],
  );

  const resetCreation = useCallback(() => {
    setProgress([]);
    setError(null);
    setIsCreating(false);
  }, []);

  return {
    isCreating,
    progress,
    error,
    createProjectWithStream,
    resetCreation,
  };
}
