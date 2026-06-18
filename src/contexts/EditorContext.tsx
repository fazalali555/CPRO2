import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { EditorSettings, EditorMetrics } from '../types/editor';

// 1. CHANNELS FOR SEPARATION OF CONCERNS
const EditorInstanceContext = createContext<any | null>(null);
const EditorMetricsContext = createContext<EditorMetrics | null>(null);
const EditorSettingsContext = createContext<{
  settings: EditorSettings;
  updateSettings: (updates: Partial<EditorSettings>) => void;
} | null>(null);

const DEFAULT_SETTINGS: EditorSettings = {
  viewMode: 'print', 
  zoom: 100,
  margins: { top: 25.4, bottom: 25.4, left: 31.75, right: 31.75 }, 
  pageSize: 'A4',   
  orientation: 'portrait',
  showRuler: true,
  spellCheck: true,
  showGridlines: false,
  showNavPane: false
};

interface ProviderProps {
  children: React.ReactNode;
  editorInstance: any; 
}

export const EditorProvider: React.FC<ProviderProps> = ({ children, editorInstance }) => {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [metrics, setMetrics] = useState<EditorMetrics>({
    wordCount: 0,
    charCount: 0,
    paragraphCount: 0,
    currentPage: 1,
    totalPages: 1
  });

  // Automatically sync metrics from editorInstance
  useEffect(() => {
    if (!editorInstance) return;

    const updateMetrics = () => {
      const { storage, state } = editorInstance;
      const wordCount = storage?.characterCount?.words() || 0;
      const charCount = storage?.characterCount?.characters() || 0;
      
      // Calculate paragraph count
      let paragraphCount = 0;
      state.doc.descendants((node: any) => {
        if (node.type.name === 'paragraph') paragraphCount++;
      });

      setMetrics(prev => ({
        ...prev,
        wordCount,
        charCount,
        paragraphCount,
        // Page calculation would go here if implemented
      }));
    };

    // Initial update
    updateMetrics();

    // Listen for updates
    editorInstance.on('update', updateMetrics);
    return () => {
      editorInstance.off('update', updateMetrics);
    };
  }, [editorInstance]);

  const updateSettings = useCallback((updates: Partial<EditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const settingsValue = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return (
    <EditorInstanceContext.Provider value={editorInstance}>
      <EditorSettingsContext.Provider value={settingsValue}>
        <EditorMetricsContext.Provider value={metrics}>
          {children}
        </EditorMetricsContext.Provider>
      </EditorSettingsContext.Provider>
    </EditorInstanceContext.Provider>
  );
};

// 2. OPTIMIZED EXPORT HOOKS (Saves memory, stops multi-component re-renders)
export const useEditorInstance = () => {
  const context = useContext(EditorInstanceContext);
  if (context === undefined) {
    throw new Error('useEditorInstance must be used within an EditorProvider');
  }
  return context;
};

export const useEditorSettings = () => {
  const context = useContext(EditorSettingsContext);
  if (!context) {
    throw new Error('useEditorSettings must be used within an EditorProvider');
  }
  return context;
};

export const useEditorMetrics = () => {
  const context = useContext(EditorMetricsContext);
  if (!context) {
    throw new Error('useEditorMetrics must be used within an EditorProvider');
  }
  return context;
};
