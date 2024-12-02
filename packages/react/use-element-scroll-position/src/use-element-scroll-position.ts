import { useEffect, useState } from 'react';

/**
 * Hook for tracking scroll position of an element
 * @param {Object} params - Hook parameters
 * @param {React.RefObject<HTMLElement>} params.scrollElementRef - Reference to the element to track
 * @returns {number} Current scroll position in pixels
 *
 * @example
 * const MyComponent = () => {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   const scrollPosition = useItemScrollPosition({ scrollElementRef: elementRef });
 *
 *   return <div ref={elementRef}>...</div>;
 * };
 */
export const useElementScrollPosition = ({
	scrollElementRef,
}: {
	scrollElementRef: React.RefObject<HTMLElement>;
}) => {
	const [scroll, setScroll] = useState(0);
	const refItem = scrollElementRef.current;

	useEffect(() => {
		if (refItem) {
			refItem.addEventListener('scroll', () => {
				refItem && setScroll(refItem?.scrollTop);
			});
		}

		return () => {
			refItem?.removeEventListener('scroll', () => {
				refItem && setScroll(refItem?.scrollTop);
			});
		};
	}, [refItem]);

	return scroll;
};
