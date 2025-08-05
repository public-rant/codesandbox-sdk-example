'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { connectToSandbox, createPreview } from '@codesandbox/sdk/browser';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  sandboxId: string;
  githubRepoUrl?: string;
}

interface SandboxSession {
  url: string;
}

interface TaskState {
  status: 'RUNNING' | 'FINISHED' | 'ERROR' | 'STOPPED' | 'UNKNOWN';
  portActive: boolean;
}

interface PreviewState {
  loading: boolean;
  connected: boolean;
  portClosed: boolean;
  preview: any | null;
}

interface SetupState {
  status: 'NOT_STARTED' | 'RUNNING' | 'FINISHED' | 'ERROR';
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string;
}

export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sandboxSession, setSandboxSession] = useState<SandboxSession | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandbox, setSandbox] = useState<any>(null);
  const [devServerTask, setDevServerTask] = useState<TaskState>({ status: 'UNKNOWN', portActive: false });
  const [vscodeTask, setVscodeTask] = useState<TaskState>({ status: 'UNKNOWN', portActive: false });
  const [taskLoading, setTaskLoading] = useState(false);
  const [vscodeTaskLoading, setVscodeTaskLoading] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({
    loading: false,
    connected: false,
    portClosed: false,
    preview: null
  });
  const [vscodeState, setVscodeState] = useState<PreviewState>({
    loading: false,
    connected: false,
    portClosed: false,
    preview: null
  });
  const [setupState, setSetupState] = useState<SetupState>({
    status: 'NOT_STARTED',
    currentStepIndex: 0,
    totalSteps: 0,
    currentStepName: ''
  });
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (project?.sandboxId && !sandbox) {
      connectToSandboxInstance();
    }
  }, [project, sandbox]);

  useEffect(() => {
    if (sandbox) {
      console.log('🔗 Sandbox connected, starting setup and task monitoring...');
      checkSetupStatus();
      checkDevServerStatus();
      checkVscodeStatus();
      // Set up periodic checking of setup and task status
      const interval = setInterval(() => {
        console.log('⏰ Periodic status check...');
        checkSetupStatus();
        if (setupState.status === 'FINISHED') {
          checkDevServerStatus();
          checkVscodeStatus();
        }
      }, 2000);
      return () => {
        console.log('🛑 Cleaning up monitoring interval');
        clearInterval(interval);
      };
    } else {
      console.log('❌ No sandbox available for monitoring');
    }
  }, [sandbox, setupState.status]);

  // Auto-create preview when dev server port becomes active and setup is finished
  useEffect(() => {
    if (sandbox && devServerTask.portActive && !previewState.preview && !previewState.loading && setupState.status === 'FINISHED') {
      console.log('🎬 Port is active and setup finished, creating preview...');
      createSandboxPreview();
    } else if (!devServerTask.portActive && previewState.preview) {
      console.log('🛑 Port is inactive, destroying preview...');
      destroyPreview();
    }
  }, [sandbox, devServerTask.portActive, previewState.preview, setupState.status]);

  // Auto-create VSCode when port becomes active and setup is finished
  useEffect(() => {
    if (sandbox && vscodeTask.portActive && !vscodeState.preview && !vscodeState.loading && setupState.status === 'FINISHED') {
      console.log('🎬 VSCode port is active and setup finished, creating VSCode preview...');
      createVscodePreview();
    } else if (!vscodeTask.portActive && vscodeState.preview) {
      console.log('🛑 VSCode port is inactive, destroying VSCode preview...');
      destroyVscodePreview();
    }
  }, [sandbox, vscodeTask.portActive, vscodeState.preview, setupState.status]);

  const fetchProject = async (id: string) => {
    try {
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
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError('Failed to load project');
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectToSandboxInstance = async () => {
    if (!project?.sandboxId) return;
    
    setSandboxLoading(true);
    try {
      // Get initial session from resume endpoint
      const initialResponse = await fetch(`/api/projects/${project.id}/resume`, {
        method: 'POST'
      });
      
      if (!initialResponse.ok) {
        throw new Error('Failed to get initial session');
      }
      
      const initialData = await initialResponse.json();
      
      // Connect to sandbox using connectToSandbox
      const connectedSandbox = await connectToSandbox({
        session: initialData.sandboxSession,
        getSession: async (id: string) => {
          const response = await fetch(`/api/projects/${project.id}/resume`, {
            method: 'POST'
          });
          const data = await response.json();
          return data.sandboxSession;
        }
      });
      
      console.log('🎉 Successfully connected to sandbox:', connectedSandbox);
      setSandbox(connectedSandbox);
      setSandboxSession(initialData.sandboxSession);
    } catch (err) {
      console.error('Failed to connect to sandbox:', err);
      setError('Failed to connect to sandbox');
    } finally {
      setSandboxLoading(false);
    }
  };

  const disconnectFromSandbox = async () => {
    if (sandbox) {
      try {
        await sandbox.disconnect();
        setSandbox(null);
        setSandboxSession(null);
        setDevServerTask({ status: 'UNKNOWN', portActive: false });
        setVscodeTask({ status: 'UNKNOWN', portActive: false });
        setSetupState({
          status: 'NOT_STARTED',
          currentStepIndex: 0,
          totalSteps: 0,
          currentStepName: ''
        });
        destroyPreview();
        destroyVscodePreview();
      } catch (err) {
        console.error('Failed to disconnect from sandbox:', err);
      }
    }
  };

  const checkSetupStatus = async () => {
    if (!sandbox) return;

    try {
      console.log('🔍 Checking setup status...');
      
      // Get setup steps
      const steps = sandbox.setup ? await sandbox.setup.getSteps() : null;
      
      if (steps && steps.length > 0) {
        console.log('📊 Setup steps:', steps);
        
        // Find current running step or determine if all are complete
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
            // If we find a pending step and no running step, setup hasn't started
            if (status === 'FINISHED') {
              status = 'NOT_STARTED';
              currentStepIndex = 0;
              currentStepName = '';
            }
          }
        }
        
        setSetupState({
          status,
          currentStepIndex,
          totalSteps: steps.length,
          currentStepName
        });
      } else {
        // If no setup steps available, assume setup is finished
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
  };

  const checkDevServerStatus = async () => {
    if (!sandbox) return;

    try {
      console.log('🔍 Checking dev server status...');
      const tasks = await sandbox.tasks.getAll();
      console.log('📋 All tasks:', tasks);
      
      const devTask = tasks.find((task: any) => task.id === 'dev-server');
      console.log('🎯 Found dev-server task:', devTask);
      
      if (devTask) {
        console.log('📊 Task status:', devTask.status);
        console.log('🔧 Task details:', {
          name: devTask.name,
          status: devTask.status,
          command: devTask.command,
          id: devTask.id
        });

        let portActive = false;
        try {
          console.log('🔌 Checking port availability...');
          const portResult = await Promise.race([
            devTask.waitForPort(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
          console.log('✅ Port check result:', portResult);
          portActive = true;
        } catch (portError) {
          console.log('❌ Port check failed:', portError.message);
          portActive = false;
        }

        console.log('📈 Final task state:', { status: devTask.status, portActive });
        setDevServerTask({
          status: devTask.status || 'UNKNOWN',
          portActive
        });
      } else {
        console.log('❌ No dev-server task found');
        setDevServerTask({ status: 'UNKNOWN', portActive: false });
      }
    } catch (err) {
      console.error('💥 Failed to check dev server status:', err);
      setDevServerTask({ status: 'ERROR', portActive: false });
    }
  };

  const checkVscodeStatus = async () => {
    if (!sandbox) return;

    try {
      console.log('🔍 Checking VSCode port status...');
      
      // Check if port 8080 is active using the ports API
      let portActive = false;
      try {
        console.log('🔌 Checking port 8080 availability...');
        const portResult = await Promise.race([
          sandbox.ports.waitForPort(8080),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
        console.log('✅ Port 8080 check result:', portResult);
        portActive = true;
      } catch (portError) {
        console.log('❌ Port 8080 check failed:', portError.message);
        portActive = false;
      }

      console.log('📈 VSCode port state:', { portActive });
      setVscodeTask({
        status: portActive ? 'RUNNING' : 'STOPPED',
        portActive
      });

      // Auto-start VS Code server if port is not open and setup is finished
      if (!portActive && setupState.status === 'FINISHED' && !vscodeTaskLoading) {
        console.log('🚀 Port 8080 is not open, auto-starting VS Code server...');
        await startVscodeServer();
      }
    } catch (err) {
      console.error('💥 Failed to check VSCode port status:', err);
      setVscodeTask({ status: 'ERROR', portActive: false });
    }
  };

  const startDevServer = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot start dev server: setup is still running');
      return;
    }
    
    console.log('🚀 Starting dev server...');
    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === 'dev-server');
      console.log('🎯 Task to start:', devTask);
      
      if (devTask) {
        console.log('▶️ Running task...');
        await devTask.run();
        console.log('✅ Task started, checking status...');
        await checkDevServerStatus();
      } else {
        console.log('❌ No dev-server task found to start');
      }
    } catch (err) {
      console.error('💥 Failed to start dev server:', err);
    } finally {
      setTaskLoading(false);
    }
  };

  const restartDevServer = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot restart dev server: setup is still running');
      return;
    }
    
    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === 'dev-server');
      
      if (devTask) {
        await devTask.restart();
        await checkDevServerStatus();
      }
    } catch (err) {
      console.error('Failed to restart dev server:', err);
    } finally {
      setTaskLoading(false);
    }
  };

  const stopDevServer = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot stop dev server: setup is still running');
      return;
    }
    
    setTaskLoading(true);
    try {
      const tasks = await sandbox.tasks.getAll();
      const devTask = tasks.find((task: any) => task.id === 'dev-server');
      
      if (devTask) {
        await devTask.stop();
        await checkDevServerStatus();
      }
    } catch (err) {
      console.error('Failed to stop dev server:', err);
    } finally {
      setTaskLoading(false);
    }
  };

  const startVscodeServer = async () => {
    if (!sandbox) return;
    
    console.log('🚀 Starting VSCode server...');
    setVscodeTaskLoading(true);
    try {
      // First check if port 8080 is already open
      let portAlreadyOpen = false;
      try {
        console.log('🔍 Checking if port 8080 is already open...');
        await Promise.race([
          sandbox.ports.waitForPort(8080),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
        ]);
        portAlreadyOpen = true;
        console.log('✅ Port 8080 is already open, skipping command execution');
      } catch (portError) {
        console.log('📝 Port 8080 is not open, will start VSCode server');
        portAlreadyOpen = false;
      }

      if (!portAlreadyOpen) {
        // Run the code-server command in the background
        console.log('▶️ Running code-server command...');
        const command = 'code-server /project/workspace/app --host 0.0.0.0 --port 8080 --auth none --disable-telemetry';
        await sandbox.commands.runBackground(command, {
          name: 'VSCode Server'
        });
        console.log('✅ Code-server command started');
        
        // Wait for port 8080 to open
        console.log('⏳ Waiting for port 8080 to open...');
        try {
          await sandbox.ports.waitForPort(8080);
          console.log('✅ Port 8080 is now open');
        } catch (waitError) {
          console.error('❌ Timeout waiting for port 8080:', waitError);
        }
      }
      
      await checkVscodeStatus();
    } catch (err) {
      console.error('💥 Failed to start VSCode server:', err);
    } finally {
      setVscodeTaskLoading(false);
    }
  };

  const startVscode = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot start VSCode: setup is still running');
      return;
    }
    
    await startVscodeServer();
  };

  const restartVscode = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot restart VSCode: setup is still running');
      return;
    }
    
    setVscodeTaskLoading(true);
    try {
      console.log('🔄 Restarting VSCode server...');
      
      // Kill existing code-server processes
      console.log('🛑 Stopping existing code-server processes...');
      await sandbox.commands.run('pkill -f "code-server.*8080" || true');
      
      // Wait a moment for the process to terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start code-server again
      console.log('▶️ Starting code-server command...');
      const command = 'code-server /project/workspace/app --host 0.0.0.0 --port 8080 --auth none --disable-telemetry';
      await sandbox.commands.runBackground(command, {
        name: 'VSCode Server'
      });
      console.log('✅ Code-server command restarted');
      
      // Wait for port 8080 to open
      console.log('⏳ Waiting for port 8080 to open...');
      try {
        await sandbox.ports.waitForPort(8080);
        console.log('✅ Port 8080 is now open');
      } catch (waitError) {
        console.error('❌ Timeout waiting for port 8080:', waitError);
      }
      
      await checkVscodeStatus();
    } catch (err) {
      console.error('💥 Failed to restart VSCode:', err);
    } finally {
      setVscodeTaskLoading(false);
    }
  };

  const stopVscode = async () => {
    if (!sandbox || setupState.status === 'RUNNING') {
      console.log('❌ Cannot stop VSCode: setup is still running');
      return;
    }
    
    setVscodeTaskLoading(true);
    try {
      console.log('🛑 Stopping VSCode server...');
      
      // Kill existing code-server processes
      await sandbox.commands.run('pkill -f "code-server.*8080" || true');
      console.log('✅ Code-server processes stopped');
      
      // Wait a moment for the process to terminate and port to close
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await checkVscodeStatus();
    } catch (err) {
      console.error('💥 Failed to stop VSCode:', err);
    } finally {
      setVscodeTaskLoading(false);
    }
  };

  const createSandboxPreview = async () => {
    if (!sandbox || !devServerTask.portActive) return;

    setPreviewState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🎬 Creating preview for port 5173...');
      
      // Get the URL for port 5173
      const previewUrl = sandbox.hosts.getUrl(5173);
      console.log('🔗 Preview URL:', previewUrl);
      
      // Create the preview
      const preview = createPreview(previewUrl);
      console.log('✅ Preview created:', preview);
      
      // Set up port monitoring
      const portOpenListener = sandbox.ports.onDidPortOpen((portInfo: any) => {
        console.log('🔌 Port opened:', portInfo);
        if (portInfo.port === 5173) {
          setPreviewState(prev => ({
            ...prev,
            portClosed: false,
            connected: true
          }));
          
          // If preview was closed due to port closure, recreate it
          if (previewState.portClosed) {
            const newPreviewUrl = sandbox.hosts.getUrl(5173);
            const newPreview = createPreview(newPreviewUrl);
            setPreviewState(prev => ({
              ...prev,
              preview: newPreview,
              loading: false
            }));
            
            // Append the new iframe
            const container = document.getElementById('preview-container');
            if (container && newPreview.iframe) {
              container.innerHTML = '';
              
              // Style the iframe to fill the container
              newPreview.iframe.style.width = '100%';
              newPreview.iframe.style.height = '100%';
              newPreview.iframe.style.border = 'none';
              newPreview.iframe.style.borderRadius = '0.5rem';
              
              container.appendChild(newPreview.iframe);
            }
          }
        }
      });

      const portCloseListener = sandbox.ports.onDidPortClose((port: number) => {
        console.log('🔌 Port closed:', port);
        if (port === 5173) {
          setPreviewState(prev => ({
            ...prev,
            portClosed: true,
            connected: false
          }));
        }
      });

      // Set up preview message handling
      preview.onMessage((message: any) => {
        console.log('📨 Preview message:', message);
        switch (message.type) {
          case 'SET_URL':
            console.log('🔗 URL changed:', message.url);
            break;
          case 'RELOAD':
            console.log('🔄 Preview reloaded');
            break;
          case 'PREVIEW_UNLOADING':
            console.log('📤 Preview unloading');
            break;
        }
      });
      
      setPreviewState({
        loading: false,
        connected: true,
        portClosed: false,
        preview: preview
      });

      // Append iframe to container and style it to fill the space
      const container = document.getElementById('preview-container');
      if (container && preview.iframe) {
        container.innerHTML = '';
        
        // Style the iframe to fill the container
        preview.iframe.style.width = '100%';
        preview.iframe.style.height = '100%';
        preview.iframe.style.border = 'none';
        preview.iframe.style.borderRadius = '0.5rem';
        
        container.appendChild(preview.iframe);
      }
      
    } catch (err) {
      console.error('💥 Failed to create preview:', err);
      setPreviewState(prev => ({
        ...prev,
        loading: false,
        connected: false
      }));
    }
  };

  const destroyPreview = () => {
    setPreviewState({
      loading: false,
      connected: false,
      portClosed: false,
      preview: null
    });
    
    const container = document.getElementById('preview-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  const createVscodePreview = async () => {
    if (!sandbox || !vscodeTask.portActive) return;

    setVscodeState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🎬 Creating VSCode preview for port 8080...');
      
      // Get the URL for port 8080 with the folder parameter
      const baseUrl = sandbox.hosts.getUrl(8080);
      const previewUrl = `${baseUrl}&folder=${encodeURIComponent("/project/workspace/app")}`;
      console.log('🔗 VSCode Preview URL:', previewUrl);
      
      // Create the preview
      const preview = createPreview(previewUrl);
      console.log('✅ VSCode Preview created:', preview);
      
      // Set up port monitoring
      const portOpenListener = sandbox.ports.onDidPortOpen((portInfo: any) => {
        console.log('🔌 Port opened:', portInfo);
        if (portInfo.port === 8080) {
          setVscodeState(prev => ({
            ...prev,
            portClosed: false,
            connected: true
          }));
          
          // If preview was closed due to port closure, recreate it
          if (vscodeState.portClosed) {
            const newBaseUrl = sandbox.hosts.getUrl(8080);
            const newPreviewUrl = `${newBaseUrl}&folder=${encodeURIComponent("/project/workspace/app")}`;
            const newPreview = createPreview(newPreviewUrl);
            setVscodeState(prev => ({
              ...prev,
              preview: newPreview,
              loading: false
            }));
            
            // Append the new iframe
            const container = document.getElementById('vscode-container');
            if (container && newPreview.iframe) {
              container.innerHTML = '';
              
              // Style the iframe to fill the container
              newPreview.iframe.style.width = '100%';
              newPreview.iframe.style.height = '100%';
              newPreview.iframe.style.border = 'none';
              newPreview.iframe.style.borderRadius = '0.5rem';
              
              container.appendChild(newPreview.iframe);
            }
          }
        }
      });

      const portCloseListener = sandbox.ports.onDidPortClose((port: number) => {
        console.log('🔌 Port closed:', port);
        if (port === 8080) {
          setVscodeState(prev => ({
            ...prev,
            portClosed: true,
            connected: false
          }));
        }
      });

      // Set up preview message handling
      preview.onMessage((message: any) => {
        console.log('📨 VSCode Preview message:', message);
        switch (message.type) {
          case 'SET_URL':
            console.log('🔗 VSCode URL changed:', message.url);
            break;
          case 'RELOAD':
            console.log('🔄 VSCode Preview reloaded');
            break;
          case 'PREVIEW_UNLOADING':
            console.log('📤 VSCode Preview unloading');
            break;
        }
      });
      
      setVscodeState({
        loading: false,
        connected: true,
        portClosed: false,
        preview: preview
      });

      // Append iframe to container and style it to fill the space
      const container = document.getElementById('vscode-container');
      if (container && preview.iframe) {
        container.innerHTML = '';
        
        // Style the iframe to fill the container
        preview.iframe.style.width = '100%';
        preview.iframe.style.height = '100%';
        preview.iframe.style.border = 'none';
        preview.iframe.style.borderRadius = '0.5rem';
        
        container.appendChild(preview.iframe);
      }
      
    } catch (err) {
      console.error('💥 Failed to create VSCode preview:', err);
      setVscodeState(prev => ({
        ...prev,
        loading: false,
        connected: false
      }));
    }
  };

  const destroyVscodePreview = () => {
    setVscodeState({
      loading: false,
      connected: false,
      portClosed: false,
      preview: null
    });
    
    const container = document.getElementById('vscode-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">{error}</h3>
          <Link
            href="/"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.githubRepoUrl && (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center mt-1"
                  >
                    {project.githubRepoUrl}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Sandbox Status */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sandbox:</span>
                <div className={`w-2 h-2 rounded-full ${
                  sandbox ? 'bg-green-400' : sandboxLoading ? 'bg-yellow-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-900">
                  {sandbox ? 'Connected' : sandboxLoading ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              
              {/* Setup Status */}
              {sandbox && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Setup:</span>
                  <div className={`w-2 h-2 rounded-full ${
                    setupState.status === 'FINISHED' ? 'bg-green-400' : 
                    setupState.status === 'RUNNING' ? 'bg-blue-400' :
                    setupState.status === 'ERROR' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-900 capitalize">
                    {setupState.status === 'FINISHED' ? 'Complete' : 
                     setupState.status === 'RUNNING' ? 'Running' :
                     setupState.status === 'ERROR' ? 'Error' :
                     'Not Started'}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                ID: {project.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Two Column Layout */}
        {sandbox && (
          <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* VSCode Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">VSCode</h2>
                <div className="flex items-center space-x-4">
                  {/* VSCode Task Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Server:</span>
                    <div className={`w-2 h-2 rounded-full ${
                      vscodeTask.status === 'RUNNING' ? 'bg-green-400' : 
                      vscodeTask.status === 'ERROR' ? 'bg-red-400' : 
                      vscodeTask.status === 'STOPPED' ? 'bg-gray-400' : 
                      'bg-yellow-400'
                    }`}></div>
                    <span className="text-sm text-gray-900 capitalize">
                      {vscodeTask.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* VSCode Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Port 8080:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        vscodeTask.portActive ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-900">
                        {vscodeTask.portActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!vscodeTask.portActive ? (
                      <button
                        onClick={startVscode}
                        disabled={vscodeTaskLoading || setupState.status === 'RUNNING'}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                      >
                        {vscodeTaskLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M12 4l6 8H6l6-8z" />
                          </svg>
                        )}
                        {setupState.status === 'RUNNING' ? 'Waiting for Setup...' : 'Start VSCode'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={restartVscode}
                          disabled={vscodeTaskLoading || setupState.status === 'RUNNING'}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                        >
                          {vscodeTaskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          Restart
                        </button>
                        <button
                          onClick={stopVscode}
                          disabled={vscodeTaskLoading || setupState.status === 'RUNNING'}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                        >
                          {vscodeTaskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                            </svg>
                          )}
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative flex-1">
                <div 
                  id="vscode-container" 
                  className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Loading state */}
                  {vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">Loading VSCode...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Port closed message */}
                  {vscodeState.portClosed && !vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Port Disconnected</h3>
                        <p className="text-gray-600">The VSCode server port has closed.</p>
                        <p className="text-sm text-gray-500 mt-1">VSCode will reload automatically when the port reopens.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Setup running */}
                  {setupState.status === 'RUNNING' && !vscodeState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Setting up Sandbox</h3>
                        <p className="text-gray-600">Please wait while the sandbox is being configured...</p>
                        {setupState.currentStepName && (
                          <p className="text-sm text-gray-500 mt-2">
                            Current step: {setupState.currentStepName}
                          </p>
                        )}
                        {setupState.totalSteps > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Step {setupState.currentStepIndex + 1} of {setupState.totalSteps}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* VSCode task not running */}
                  {setupState.status !== 'RUNNING' && !vscodeTask.portActive && !vscodeState.loading && !vscodeState.portClosed && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No VSCode Available</h3>
                        <p className="text-gray-600">Start the VSCode server to access the editor.</p>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>

            {/* Development Preview Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Development Preview</h2>
                <div className="flex items-center space-x-4">
                  {/* Dev Server Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Server:</span>
                    <div className={`w-2 h-2 rounded-full ${
                      devServerTask.status === 'RUNNING' ? 'bg-green-400' : 
                      devServerTask.status === 'ERROR' ? 'bg-red-400' : 
                      devServerTask.status === 'STOPPED' ? 'bg-gray-400' : 
                      'bg-yellow-400'
                    }`}></div>
                    <span className="text-sm text-gray-900 capitalize">
                      {devServerTask.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Dev Server Controls */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Port 5173:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        devServerTask.portActive ? 'bg-green-400' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-900">
                        {devServerTask.portActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!devServerTask.portActive ? (
                      <button
                        onClick={startDevServer}
                        disabled={taskLoading || setupState.status === 'RUNNING'}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                      >
                        {taskLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M12 4l6 8H6l6-8z" />
                          </svg>
                        )}
                        {setupState.status === 'RUNNING' ? 'Waiting for Setup...' : 'Start Dev Server'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={restartDevServer}
                          disabled={taskLoading || setupState.status === 'RUNNING'}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                        >
                          {taskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          Restart
                        </button>
                        <button
                          onClick={stopDevServer}
                          disabled={taskLoading || setupState.status === 'RUNNING'}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title={setupState.status === 'RUNNING' ? 'Setup is running, please wait...' : ''}
                        >
                          {taskLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                            </svg>
                          )}
                          Stop
                        </button>
                        {previewState.connected && previewState.preview && (
                          <button
                            onClick={() => {
                              if (previewState.preview?.iframe && sandbox) {
                                const currentSrc = previewState.preview.iframe.src;
                                previewState.preview.iframe.src = '';
                                setTimeout(() => {
                                  previewState.preview.iframe.src = currentSrc;
                                }, 10);
                              }
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reload Preview
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative flex-1">
                <div 
                  id="preview-container" 
                  className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Loading state */}
                  {previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Port closed message */}
                  {previewState.portClosed && !previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Port Disconnected</h3>
                        <p className="text-gray-600">The development server port has closed.</p>
                        <p className="text-sm text-gray-500 mt-1">Preview will reload automatically when the port reopens.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Setup running */}
                  {setupState.status === 'RUNNING' && !previewState.loading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Setting up Sandbox</h3>
                        <p className="text-gray-600">Please wait while the sandbox is being configured...</p>
                        {setupState.currentStepName && (
                          <p className="text-sm text-gray-500 mt-2">
                            Current step: {setupState.currentStepName}
                          </p>
                        )}
                        {setupState.totalSteps > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Step {setupState.currentStepIndex + 1} of {setupState.totalSteps}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Dev server not running */}
                  {setupState.status !== 'RUNNING' && !devServerTask.portActive && !previewState.loading && !previewState.portClosed && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
                        <p className="text-gray-600">Start the development server to see a preview.</p>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}