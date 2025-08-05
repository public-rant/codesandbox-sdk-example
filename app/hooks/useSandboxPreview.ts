'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPreview } from '@codesandbox/sdk/browser';

interface PreviewState {
  loading: boolean;
  connected: boolean;
  portClosed: boolean;
  preview: any | null;
}

interface UseSandboxPreviewReturn {
  previewState: PreviewState;
  vscodeState: PreviewState;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  vscodeContainerRef: React.RefObject<HTMLDivElement | null>;
  createSandboxPreview: () => Promise<void>;
  createVscodePreview: () => Promise<void>;
  destroyPreview: () => void;
  destroyVscodePreview: () => void;
}

export function useSandboxPreview(sandbox: any): UseSandboxPreviewReturn {
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

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const vscodeContainerRef = useRef<HTMLDivElement | null>(null);

  // Manage preview iframe insertion
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || !previewState.preview?.iframe) return;

    if (!container.contains(previewState.preview.iframe)) {
      container.appendChild(previewState.preview.iframe);
    }
  }, [previewState.preview]);

  // Manage VSCode iframe insertion
  useEffect(() => {
    const container = vscodeContainerRef.current;
    if (!container || !vscodeState.preview?.iframe) return;

    if (!container.contains(vscodeState.preview.iframe)) {
      container.appendChild(vscodeState.preview.iframe);
    }
  }, [vscodeState.preview]);

  const createSandboxPreview = useCallback(async () => {
    if (!sandbox) return;

    setPreviewState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🎬 Creating preview for port 5173...');
      
      const previewUrl = sandbox.hosts.getUrl(5173);
      console.log('🔗 Preview URL:', previewUrl);
      
      const preview = createPreview(previewUrl);
      console.log('✅ Preview created:', preview);

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

      if (preview.iframe) {
        preview.iframe.style.width = '100%';
        preview.iframe.style.height = '100%';
        preview.iframe.style.border = 'none';
        preview.iframe.style.borderRadius = '0.5rem';
      }
      
    } catch (err) {
      console.error('💥 Failed to create preview:', err);
      setPreviewState(prev => ({
        ...prev,
        loading: false,
        connected: false
      }));
    }
  }, [sandbox]);

  const createVscodePreview = useCallback(async () => {
    if (!sandbox) return;

    setVscodeState(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🎬 Creating VSCode preview for port 8080...');
      
      const baseUrl = sandbox.hosts.getUrl(8080);
      const previewUrl = `${baseUrl}&folder=${encodeURIComponent("/project/workspace/app")}`;
      console.log('🔗 VSCode Preview URL:', previewUrl);
      
      const preview = createPreview(previewUrl);
      console.log('✅ VSCode Preview created:', preview);

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

      if (preview.iframe) {
        preview.iframe.style.width = '100%';
        preview.iframe.style.height = '100%';
        preview.iframe.style.border = 'none';
        preview.iframe.style.borderRadius = '0.5rem';
      }
      
    } catch (err) {
      console.error('💥 Failed to create VSCode preview:', err);
      setVscodeState(prev => ({
        ...prev,
        loading: false,
        connected: false
      }));
    }
  }, [sandbox]);

  const destroyPreview = useCallback(() => {
    if (previewState.preview) {
      try {
        if (typeof previewState.preview.destroy === 'function') {
          previewState.preview.destroy();
        }
        if (previewState.preview.iframe && previewState.preview.iframe.parentNode) {
          previewState.preview.iframe.parentNode.removeChild(previewState.preview.iframe);
        }
      } catch (error) {
        console.warn('Error cleaning up preview:', error);
      }
    }
    
    setPreviewState({
      loading: false,
      connected: false,
      portClosed: false,
      preview: null
    });
  }, [previewState.preview]);

  const destroyVscodePreview = useCallback(() => {
    if (vscodeState.preview) {
      try {
        if (typeof vscodeState.preview.destroy === 'function') {
          vscodeState.preview.destroy();
        }
        if (vscodeState.preview.iframe && vscodeState.preview.iframe.parentNode) {
          vscodeState.preview.iframe.parentNode.removeChild(vscodeState.preview.iframe);
        }
      } catch (error) {
        console.warn('Error cleaning up VSCode preview:', error);
      }
    }
    
    setVscodeState({
      loading: false,
      connected: false,
      portClosed: false,
      preview: null
    });
  }, [vscodeState.preview]);

  return {
    previewState,
    vscodeState,
    previewContainerRef,
    vscodeContainerRef,
    createSandboxPreview,
    createVscodePreview,
    destroyPreview,
    destroyVscodePreview,
  };
}