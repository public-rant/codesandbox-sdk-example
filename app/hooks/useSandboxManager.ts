'use client';

import { useEffect, useState } from 'react';
import { useCodeSandbox } from './useCodeSandbox';
import { useSandboxTasks } from './useSandboxTasks';
import { useSandboxPreview } from './useSandboxPreview';

interface UseSandboxManagerReturn {
  // CodeSandbox connection
  sandbox: any;
  sandboxSession: any;
  sandboxLoading: boolean;
  sandboxError: string | null;
  setupState: any;
  connectToSandboxInstance: (projectId: string, sandboxId: string) => Promise<void>;
  disconnectFromSandbox: () => Promise<void>;
  
  // Tasks
  devServerTask: any;
  vscodeTask: any;
  taskLoading: boolean;
  vscodeTaskLoading: boolean;
  startDevServer: () => Promise<void>;
  restartDevServer: () => Promise<void>;
  stopDevServer: () => Promise<void>;
  startVscode: () => Promise<void>;
  restartVscode: () => Promise<void>;
  stopVscode: () => Promise<void>;
  
  // Previews
  previewState: any;
  vscodeState: any;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  vscodeContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useSandboxManager(): UseSandboxManagerReturn {
  const [vscodeUserInteracted, setVscodeUserInteracted] = useState(false);
  
  const {
    sandbox,
    sandboxSession,
    loading: sandboxLoading,
    error: sandboxError,
    setupState,
    connectToSandboxInstance,
    disconnect,
    checkSetupStatus,
  } = useCodeSandbox();

  const setupFinished = setupState.status === 'FINISHED';

  const {
    devServerTask,
    vscodeTask,
    taskLoading,
    vscodeTaskLoading,
    checkDevServerStatus,
    checkVscodeStatus,
    startDevServer: _startDevServer,
    restartDevServer,
    stopDevServer,
    startVscode: _startVscode,
    restartVscode,
    stopVscode,
  } = useSandboxTasks(sandbox, setupFinished);

  const {
    previewState,
    vscodeState,
    previewContainerRef,
    vscodeContainerRef,
    createSandboxPreview,
    createVscodePreview,
    destroyPreview,
    destroyVscodePreview,
  } = useSandboxPreview(sandbox);

  // Auto-monitor setup and tasks when sandbox is connected
  useEffect(() => {
    if (sandbox) {
      console.log('🔗 Sandbox connected, starting setup and task monitoring...');
      checkSetupStatus();
      checkDevServerStatus();
      checkVscodeStatus();
      
      // Set up port listeners
      const portOpenListener = sandbox.ports.onDidPortOpen((portInfo: any) => {
        console.log('🔌 Port opened:', portInfo);
        if (portInfo.port === 5173) {
          console.log('✅ Dev server port 5173 opened');
          checkDevServerStatus();
        } else if (portInfo.port === 8080) {
          console.log('✅ VSCode port 8080 opened');
          checkVscodeStatus();
        }
      });

      const portCloseListener = sandbox.ports.onDidPortClose((port: number) => {
        console.log('🔌 Port closed:', port);
        if (port === 5173) {
          console.log('❌ Dev server port 5173 closed');
          checkDevServerStatus();
        } else if (port === 8080) {
          console.log('❌ VSCode port 8080 closed');
          checkVscodeStatus();
        }
      });

      // Setup monitoring
      let setupInterval: NodeJS.Timeout | null = null;
      if (setupState.status === 'RUNNING' || setupState.status === 'NOT_STARTED') {
        setupInterval = setInterval(() => {
          console.log('⏰ Checking setup status...');
          checkSetupStatus();
        }, 2000);
      }

      return () => {
        console.log('🛑 Cleaning up port listeners and setup monitoring');
        if (portOpenListener) portOpenListener.dispose?.();
        if (portCloseListener) portCloseListener.dispose?.();
        if (setupInterval) clearInterval(setupInterval);
      };
    }
  }, [sandbox, setupState.status, checkSetupStatus, checkDevServerStatus, checkVscodeStatus]);

  // Auto-create preview when dev server port becomes active and setup is finished
  useEffect(() => {
    if (sandbox && devServerTask.portActive && !previewState.preview && !previewState.loading && setupFinished) {
      console.log('🎬 Port is active and setup finished, creating preview...');
      createSandboxPreview();
    } else if (!devServerTask.portActive && previewState.preview) {
      console.log('🛑 Port is inactive, destroying preview...');
      destroyPreview();
    }
  }, [sandbox, devServerTask.portActive, previewState.preview, previewState.loading, setupFinished, createSandboxPreview, destroyPreview]);

  // Auto-create VSCode when port becomes active and setup is finished
  useEffect(() => {
    if (sandbox && vscodeTask.portActive && !vscodeState.preview && !vscodeState.loading && setupFinished) {
      console.log('🎬 VSCode port is active and setup finished, creating VSCode preview...');
      createVscodePreview();
    } else if (!vscodeTask.portActive && vscodeState.preview) {
      console.log('🛑 VSCode port is inactive, destroying VSCode preview...');
      destroyVscodePreview();
    }
  }, [sandbox, vscodeTask.portActive, vscodeState.preview, vscodeState.loading, setupFinished, createVscodePreview, destroyVscodePreview]);

  // Auto-start VSCode on initial load if not user-interacted
  useEffect(() => {
    if (sandbox && !vscodeTask.portActive && setupFinished && !vscodeTaskLoading && !vscodeUserInteracted) {
      console.log('🚀 Auto-starting VSCode server...');
      _startVscode();
    }
  }, [sandbox, vscodeTask.portActive, setupFinished, vscodeTaskLoading, vscodeUserInteracted, _startVscode]);

  const disconnectFromSandbox = async () => {
    destroyPreview();
    destroyVscodePreview();
    await disconnect();
    setVscodeUserInteracted(false);
  };

  const startDevServer = async () => {
    await _startDevServer();
  };

  const startVscode = async () => {
    setVscodeUserInteracted(true);
    await _startVscode();
  };

  return {
    // CodeSandbox connection
    sandbox,
    sandboxSession,
    sandboxLoading,
    sandboxError,
    setupState,
    connectToSandboxInstance,
    disconnectFromSandbox,
    
    // Tasks
    devServerTask,
    vscodeTask,
    taskLoading,
    vscodeTaskLoading,
    startDevServer,
    restartDevServer,
    stopDevServer,
    startVscode,
    restartVscode,
    stopVscode,
    
    // Previews
    previewState,
    vscodeState,
    previewContainerRef,
    vscodeContainerRef,
  };
}