
import { useIsFirstRender } from "@ws-utils/use-is-first-render";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * A custom React hook that executes a callback function at regular intervals.
 *
 * @param {() => void} callback - The function to be executed at each interval.
 * @param {number | null} delay - The delay in milliseconds between each interval. If null, the interval is not started.
 * @return {void} This hook does not return anything.
 */

export const useInterval = (
    callback: () => void,
    delay: number | null,
  ): void => {
    const isFirstRender = useIsFirstRender();
    const savedCallback = useRef<() => void>(callback);
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useLayoutEffect(() => {
      isFirstRender && savedCallback.current();
    }, [isFirstRender]);
  
    useEffect(() => {
      function tick(): void {
        savedCallback.current();
      }
      if (delay !== null) {
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  };
  