
import { useEffect, useRef } from 'react';

/**
 * Hook to automatically trigger window.print() when content is ready.
 * Handles single-fire logic and delay for rendering.
 */
export const useAutoPrint = (isReady: boolean = true, delay: number = 1000) => {
  const printedRef = useRef(false);

  useEffect(() => {
    if (isReady && !printedRef.current) {
      printedRef.current = true;
      
      const timer = setTimeout(() => {
        window.print();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isReady, delay]);
};
