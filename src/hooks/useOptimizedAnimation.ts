import { useCallback, useRef, useEffect } from 'react';

/**
 * Optimized animation loop hook that reduces CPU usage and improves performance
 */
export const useOptimizedAnimationLoop = (
  callback: (deltaTime: number) => void,
  dependencies: React.DependencyList = [],
  options: {
    targetFPS?: number;
    pauseWhenHidden?: boolean;
    throttle?: boolean;
  } = {}
) => {
  const {
    targetFPS = 60,
    pauseWhenHidden = true,
    throttle = true
  } = options;

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  
  const targetFrameTime = 1000 / targetFPS;

  // Optimized callback with throttling
  const optimizedCallback = useCallback((timestamp: number) => {
    // Skip frame if document is hidden and pauseWhenHidden is enabled
    if (pauseWhenHidden && !isVisibleRef.current) {
      rafRef.current = requestAnimationFrame(optimizedCallback);
      return;
    }

    // Throttling: only execute if enough time has passed
    if (throttle && timestamp - lastTimeRef.current < targetFrameTime) {
      rafRef.current = requestAnimationFrame(optimizedCallback);
      return;
    }

    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // Cap delta to prevent large jumps
    lastTimeRef.current = timestamp;
    
    // Execute the callback
    try {
      callback(deltaTime);
    } catch (error) {
      console.error('[Animation Loop] Error in callback:', error);
    }

    // Continue the loop
    rafRef.current = requestAnimationFrame(optimizedCallback);
  }, [callback, targetFrameTime, throttle, pauseWhenHidden]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Reset timing when becoming visible again
        lastTimeRef.current = performance.now();
      }
    };

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [pauseWhenHidden]);

  // Start/stop the animation loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(optimizedCallback);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [optimizedCallback, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
};

/**
 * Debounced resize observer hook for performance
 */
export const useDebounceResize = (callback: () => void, delay: number = 150) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(debouncedCallback);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedCallback]);
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = () => {
  const frameCountRef = useRef(0);
  const lastFPSUpdateRef = useRef(performance.now());
  const fpsRef = useRef(60);

  const updateFPS = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastFPSUpdateRef.current;

    if (elapsed >= 1000) { // Update every second
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      fpsRef.current = fps;
      frameCountRef.current = 0;
      lastFPSUpdateRef.current = now;

      // Log performance warnings
      if (fps < 30) {
        console.warn(`[Performance] Low FPS detected: ${fps}fps`);
      }
    }
  }, []);

  return { updateFPS, getCurrentFPS: () => fpsRef.current };
};