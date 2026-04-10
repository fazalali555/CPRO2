// hooks/useUndoRedo.ts - Undo/Redo History Hook

import { useState, useCallback, useRef } from 'react';

interface UseUndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistory = 50 } = options;
  
  const [state, setState] = useState<T>(initialState);
  const historyRef = useRef<T[]>([initialState]);
  const currentIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  const pushState = useCallback((newState: T) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Remove any future states if we're not at the end
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(newState);
    
    // Trim if exceeds max
    if (historyRef.current.length > maxHistory) {
      historyRef.current = historyRef.current.slice(-maxHistory);
    }
    
    currentIndexRef.current = historyRef.current.length - 1;
    setState(newState);
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const previousState = historyRef.current[currentIndexRef.current];
      isUndoRedoRef.current = true;
      setState(previousState);
      return previousState;
    }
    return state;
  }, [state]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const nextState = historyRef.current[currentIndexRef.current];
      isUndoRedoRef.current = true;
      setState(nextState);
      return nextState;
    }
    return state;
  }, [state]);

  const reset = useCallback((newInitialState?: T) => {
    const resetState = newInitialState ?? initialState;
    historyRef.current = [resetState];
    currentIndexRef.current = 0;
    setState(resetState);
  }, [initialState]);

  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;
  const historyLength = historyRef.current.length;
  const currentIndex = currentIndexRef.current;

  return {
    state,
    setState: pushState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength,
    currentIndex,
  };
}