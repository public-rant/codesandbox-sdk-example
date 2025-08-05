'use client';

import { useState, useEffect, useCallback } from 'react';
import { connectToSandbox } from '@codesandbox/sdk/browser';

interface SandboxSession {
  url: string;
}

interface TaskState {
  status: 'RUNNING' | 'FINISHED' | 'ERROR' | 'STOPPED' | 'UNKNOWN' | 'LOADING';
  portActive: boolean;
}

interface SetupState {
  status: 'NOT_STARTED' | 'RUNNING' | 'FINISHED' | 'ERROR';
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string;
}

interface UseCodeSandboxReturn {
  sandbox: any;
  sandboxSession: SandboxSession | null;
  loading: boolean;
  error: string | null;
  setupState: SetupState;
  connectToSandboxInstance: (projectId: string, sandboxId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
}

export function useCodeSandbox(): UseCodeSandboxReturn {
  const [sandbox, setSandbox] = useState<any>(null);
  const [sandboxSession, setSandboxSession] = useState<SandboxSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupState, setSetupState] = useState<SetupState>({
    status: 'NOT_STARTED',
    currentStepIndex: 0,
    totalSteps: 0,
    currentStepName: ''
  });

  const checkSetupStatus = useCallback(async () => {
    if (!sandbox) return;

    try {
      console.log('🔍 Checking setup status...');
      
      const steps = sandbox.setup ? await sandbox.setup.getSteps() : null;
      
      if (steps && steps.length > 0) {
        console.log('📊 Setup steps:', steps);
        
        let currentStepIndex = 0;
        let status = 'FINISHED';
        let currentStepName = '';
        
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (step.status === 'RUNNING') {
            currentStepIndex = i;
            status = 'RUNNING';
            currentStepName = step.name || `Step ${i + 1}`;
            break;
          } else if (step.status === 'ERROR') {
            currentStepIndex = i;
            status = 'ERROR';
            currentStepName = step.name || `Step ${i + 1} (Error)`;
            break;
          } else if (step.status === 'PENDING') {
            if (status === 'FINISHED') {
              status = 'NOT_STARTED';
              currentStepIndex = 0;
              currentStepName = '';
            }
          }
        }
        
        setSetupState({
          status: status as 'RUNNING' | 'FINISHED' | 'ERROR' | 'NOT_STARTED',
          currentStepIndex,
          totalSteps: steps.length,
          currentStepName
        });
      } else {
        console.log('No setup steps found, assuming setup is finished');
        setSetupState({
          status: 'FINISHED',
          currentStepIndex: 0,
          totalSteps: 0,
          currentStepName: ''
        });
      }
    } catch (err) {
      console.error('💥 Failed to check setup status:', err);
      setSetupState({
        status: 'ERROR',
        currentStepIndex: 0,
        totalSteps: 0,
        currentStepName: 'Setup check failed'
      });
    }
  }, [sandbox]);

  const connectToSandboxInstance = useCallback(async (projectId: string, sandboxId: string) => {
    setLoading(true);
    setError(null);

    try {
      const initialResponse = await fetch(`/api/projects/${projectId}/resume`, {
        method: 'POST'
      });
      
      if (!initialResponse.ok) {
        throw new Error('Failed to get initial session');
      }
      
      const initialResult = await initialResponse.json();
      const initialData = initialResult.data || initialResult;
      
      const connectedSandbox = await connectToSandbox({
        session: initialData.sandboxSession,
        getSession: async (id: string) => {
          const response = await fetch(`/api/projects/${projectId}/resume`, {
            method: 'POST'
          });
          const result = await response.json();
          const data = result.data || result;
          return data.sandboxSession;
        }
      });
      
      console.log('🎉 Successfully connected to sandbox:', connectedSandbox);
      setSandbox(connectedSandbox);
      setSandboxSession(initialData.sandboxSession);
    } catch (err) {
      console.error('Failed to connect to sandbox:', err);
      setError('Failed to connect to sandbox');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (sandbox) {
      try {
        await sandbox.disconnect();
        setSandbox(null);
        setSandboxSession(null);
        setSetupState({
          status: 'NOT_STARTED',
          currentStepIndex: 0,
          totalSteps: 0,
          currentStepName: ''
        });
        setError(null);
      } catch (err) {
        console.error('Failed to disconnect from sandbox:', err);
        throw err;
      }
    }
  }, [sandbox]);

  return {
    sandbox,
    sandboxSession,
    loading,
    error,
    setupState,
    connectToSandboxInstance,
    disconnect,
    checkSetupStatus,
  };
}