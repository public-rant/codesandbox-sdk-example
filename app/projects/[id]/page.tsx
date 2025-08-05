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
  const [taskLoading, setTaskLoading] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({
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
      // Set up periodic checking of setup and task status
      const interval = setInterval(() => {
        console.log('⏰ Periodic status check...');
        checkSetupStatus();
        if (setupState.status === 'FINISHED') {
          checkDevServerStatus();
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
        setSetupState({
          status: 'NOT_STARTED',
          currentStepIndex: 0,
          totalSteps: 0,
          currentStepName: ''
        });
        destroyPreview();
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
                <p className="text-gray-600 mt-1">Project Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                ID: {project.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-900 font-medium">
                      {project.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-900">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sandbox ID</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-900 font-mono text-sm">
                    {project.sandboxId}
                  </div>
                </div>

                {project.githubRepoUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Repository</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <a
                        href={project.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                      >
                        {project.githubRepoUrl}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Actions</h2>
              
              <div className="space-y-4">
                {sandbox ? (
                  <button
                    onClick={disconnectFromSandbox}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-center flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Disconnect
                  </button>
                ) : sandboxLoading ? (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white px-4 py-3 rounded-lg font-medium text-center flex items-center justify-center cursor-not-allowed"
                  >
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Connecting to Sandbox...
                  </button>
                ) : (
                  <button
                    onClick={connectToSandboxInstance}
                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Connect to Sandbox
                  </button>
                )}

                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center block"
                >
                  Back to Dashboard
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Sandbox Status</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      sandbox ? 'bg-green-400' : sandboxLoading ? 'bg-yellow-400' : 'bg-gray-400'
                    }`}></div>
                    {sandbox ? 'Connected' : sandboxLoading ? 'Connecting...' : 'Disconnected'}
                  </div>
                </div>

                {sandbox && (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Setup Status</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        setupState.status === 'FINISHED' ? 'bg-green-400' : 
                        setupState.status === 'RUNNING' ? 'bg-blue-400' :
                        setupState.status === 'ERROR' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="capitalize">
                        {setupState.status === 'FINISHED' ? 'Complete' : 
                         setupState.status === 'RUNNING' ? 'Running' :
                         setupState.status === 'ERROR' ? 'Error' :
                         'Not Started'}
                      </span>
                    </div>
                  </div>
                )}

                {sandbox && setupState.status === 'RUNNING' && setupState.totalSteps > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span>Setup Progress</span>
                      <span className="text-xs text-gray-500">
                        {setupState.currentStepIndex + 1} of {setupState.totalSteps}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((setupState.currentStepIndex + 1) / setupState.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                    {setupState.currentStepName && (
                      <div className="text-xs text-gray-500 truncate">
                        Current: {setupState.currentStepName}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Preview Section */}
        {sandbox && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  
                  {/* Preview Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Preview:</span>
                    <div className={`w-2 h-2 rounded-full ${
                      previewState.connected && !previewState.portClosed ? 'bg-green-400' : 
                      previewState.loading ? 'bg-yellow-400' : 
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-900">
                      {previewState.loading ? 'Loading' : 
                       previewState.connected && !previewState.portClosed ? 'Connected' : 
                       previewState.portClosed ? 'Disconnected' :
                       devServerTask.portActive ? 'Ready' :
                       'Inactive'}
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
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div 
                  id="preview-container" 
                  className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                  style={{ height: '600px', minHeight: '600px' }}
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
                
                {/* Preview controls */}
                {devServerTask.portActive && (
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      {!previewState.connected && !previewState.loading && (
                        <button
                          onClick={createSandboxPreview}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Connect Preview
                        </button>
                      )}
                    </div>
                    
                    {previewState.connected && previewState.preview && (
                      <div className="flex space-x-2">
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
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reload Preview
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}