'use client';

import { useState } from 'react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

interface ProgressStep {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsCreating(true);
    setError(null);
    setProgress([]);

    try {
      // Start listening to progress events
      const eventSource = new EventSource(`/api/projects/create-stream?name=${encodeURIComponent(projectName.trim())}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgress(prev => {
            const newProgress = [...prev];
            const existingIndex = newProgress.findIndex(step => step.id === data.step.id);
            
            if (existingIndex >= 0) {
              newProgress[existingIndex] = data.step;
            } else {
              newProgress.push(data.step);
            }
            
            return newProgress;
          });
        } else if (data.type === 'success') {
          eventSource.close();
          setIsCreating(false);
          onProjectCreated(data.projectId);
        } else if (data.type === 'error') {
          eventSource.close();
          setIsCreating(false);
          setError(data.message);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsCreating(false);
        setError('Connection to server lost. Please try again.');
      };

    } catch (err) {
      setIsCreating(false);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setProjectName('');
      setProgress([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#1f2937',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>Create New Project</h2>
        
        {!isCreating ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="projectName" style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#374151' }}>
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  color: '#1f2937',
                  backgroundColor: '#ffffff'
                }}
                autoFocus
              />
            </div>
            
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #fecaca',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Create Project
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>Creating "{projectName}"...</h3>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {progress.map((step) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div style={{ marginRight: '12px', width: '20px', textAlign: 'center', fontSize: '16px' }}>
                    {step.status === 'completed' && <span style={{ color: '#10b981' }}>✓</span>}
                    {step.status === 'in_progress' && <span style={{ color: '#3b82f6' }}>⋯</span>}
                    {step.status === 'error' && <span style={{ color: '#ef4444' }}>✗</span>}
                    {step.status === 'pending' && <span style={{ color: '#9ca3af' }}>○</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      color: step.status === 'error' ? '#ef4444' : 
                             step.status === 'completed' ? '#059669' :
                             step.status === 'in_progress' ? '#2563eb' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: '500',
                      lineHeight: '1.4'
                    }}>
                      {step.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                marginTop: '16px',
                border: '1px solid #fecaca',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}