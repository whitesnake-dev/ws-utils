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
 *   };
 *   const ref = useOutsideClick<HTMLDivElement>(handleOutsideClick);
 *   return <div ref={ref}>Content</div>;
 * };
 * ```
 */
export const useOutsideClick = <T extends HTMLElement>(
	callback: (event: DocumentEventMap[keyof DocumentEventMap]) => void,
	eventType: keyof DocumentEventMap = 'mousedown'
) => {
	const ref = useRef<T>(null);

	useEffect(() => {
		const handleClickOutside = (event: DocumentEventMap[typeof eventType]) => {
			if (
				event instanceof MouseEvent &&
				ref.current &&
				!ref.current.contains(event.target as Node)
			) {
				callback(event);
			}
		};

		document.addEventListener(eventType, handleClickOutside);

		return () => {
			document.removeEventListener(eventType, handleClickOutside);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [callback]);

	return ref;
};
