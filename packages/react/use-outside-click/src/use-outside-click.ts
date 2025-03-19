import { useEffect, useRef } from 'react';

/**
 * Hook for detecting clicks outside of a specified element
 * @template T - Type of HTML element
 * @param callback - Function to be called when a click outside occurs, receives the event as parameter
 * @param eventType - DOM event type to listen for (defaults to 'mousedown')
 * @returns React ref to be attached to the tracked element
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const handleOutsideClick = (event) => {
 *     // Handle click outside with access to the event
 *     console.log(event.target);
 *   };
 *   const ref = useOutsideClick<HTMLDivElement>(handleOutsideClick);
 *   return <div ref={ref}>Content</div>;
 * };
 * ```
 */
export const useOutsideClick = <T extends HTMLElement>(
  callback: (event: Event) => void,
  eventType: keyof DocumentEventMap = 'mousedown'
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) {
        callback(event);
      }
    };

    document.addEventListener(eventType, handleClickOutside);

    return () => {
      document.removeEventListener(eventType, handleClickOutside);
    };
  }, [callback, eventType]);

  return ref;
};
