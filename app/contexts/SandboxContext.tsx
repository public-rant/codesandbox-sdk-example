'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { connectToSandbox } from '@codesandbox/sdk/browser';

interface SandboxSession {
  url: string;
}

interface SetupState {
  status: 'NOT_STARTED' | 'RUNNING' | 'FINISHED' | 'ERROR';
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string;
}

interface SandboxContextValue {
  // Core sandbox state
  sandbox: any;
  sandboxSession: SandboxSession | null;
  loading: boolean;
  error: string | null;
  setupState: SetupState;
  
  // Connection methods
  connectToSandboxInstance: (projectId: string, sandboxId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Setup monitoring
  checkSetupStatus: () => Promise<void>;
  
  // Event handlers (for port monitoring, etc.)
  onPortOpen: (callback: (portInfo: any) => void) => () => void;
  onPortClose: (callback: (port: number) => void) => () => void;
}

const SandboxContext = createContext<SandboxContextValue | null>(null);

export function useSandboxContext(): SandboxContextValue {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error('useSandboxContext must be used within a SandboxProvider');
  }
  return context;
}

interface SandboxProviderProps {
  children: React.ReactNode;
}

export function SandboxProvider({ children }: SandboxProviderProps) {
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

  // Port event listeners registry
  const [portOpenListeners, setPortOpenListeners] = useState<Set<(portInfo: any) => void>>(new Set());
  const [portCloseListeners, setPortCloseListeners] = useState<Set<(port: number) => void>>(new Set());

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
        
        // Clear all listeners
        setPortOpenListeners(new Set());
        setPortCloseListeners(new Set());
      } catch (err) {
        console.error('Failed to disconnect from sandbox:', err);
        throw err;
      }
    }
  }, [sandbox]);

  // Event handler registration
  const onPortOpen = useCallback((callback: (portInfo: any) => void) => {
    setPortOpenListeners(prev => new Set([...prev, callback]));
    
    // Return cleanup function
    return () => {
      setPortOpenListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const onPortClose = useCallback((callback: (port: number) => void) => {
    setPortCloseListeners(prev => new Set([...prev, callback]));
    
    // Return cleanup function
    return () => {
      setPortCloseListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  // Set up sandbox event listeners when sandbox is available
  useEffect(() => {
    if (!sandbox) return;

    console.log('🔗 Setting up sandbox event listeners...');

    // Set up port listeners
    const portOpenListener = sandbox.ports.onDidPortOpen((portInfo: any) => {
      console.log('🔌 Port opened:', portInfo);
      portOpenListeners.forEach(callback => callback(portInfo));
    });

    const portCloseListener = sandbox.ports.onDidPortClose((port: number) => {
      console.log('🔌 Port closed:', port);
      portCloseListeners.forEach(callback => callback(port));
    });

    // Initial setup check
    checkSetupStatus();

    // Setup monitoring interval
    let setupInterval: NodeJS.Timeout | null = null;
    if (setupState.status === 'RUNNING' || setupState.status === 'NOT_STARTED') {
      setupInterval = setInterval(() => {
        console.log('⏰ Checking setup status...');
        checkSetupStatus();
      }, 2000);
    }

    return () => {
      console.log('🛑 Cleaning up sandbox event listeners');
      if (portOpenListener) portOpenListener.dispose?.();
      if (portCloseListener) portCloseListener.dispose?.();
      if (setupInterval) clearInterval(setupInterval);
    };
  }, [sandbox, setupState.status, checkSetupStatus, portOpenListeners, portCloseListeners]);

  const contextValue: SandboxContextValue = {
    sandbox,
    sandboxSession,
    loading,
    error,
    setupState,
    connectToSandboxInstance,
    disconnect,
    checkSetupStatus,
    onPortOpen,
    onPortClose,
  };

  return (
    <SandboxContext.Provider value={contextValue}>
      {children}
    </SandboxContext.Provider>
  );
}