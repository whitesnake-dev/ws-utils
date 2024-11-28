import { useEffect, useRef, useState } from 'react';


/**
 * A custom React hook that ensures an effect callback is only executed once during the component's lifecycle.
 * Similar to useEffect, but guarantees single execution even with strict mode and component re-renders.
 * 
 * @param effect - A callback function that contains the effect logic. Can optionally return a cleanup function.
 * @example
 * useEffectOnce(() => {
 *   // Effect code here
 *   console.log('This will run exactly once');
 *   
 *   return () => {
 *     // Optional cleanup code
 *     console.log('Cleanup will run once on unmount');
 *   };
 * });
 */

export const useEffectOnce = (effect: () => void) => {
  const effectFn = useRef(effect);
  const destroyFn = useRef<void | (() => void)>();

  const effectCalled = useRef(false);
  const rendered = useRef(false);
  const [, refresh] = useState(0);

  if (effectCalled.current) {
    rendered.current = true;
  }

  useEffect(() => {
    if (!effectCalled.current) {
      destroyFn.current = effectFn.current();
      effectCalled.current = true;
    }

    refresh(1);

    return () => {
      if (!rendered.current) return;
      if (destroyFn.current) destroyFn.current();
    };
  }, []);
};
