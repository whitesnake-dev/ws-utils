import { RefObject, useLayoutEffect, useState } from 'react';

export type HookProps<T> = {
	element: RefObject<T | null>;
};

/**
 * Custom hook to get the size of an element.
 *
 * @param {RefObject<T | null>} element - Reference to the element
 * @return {{ cw: number; ch: number; } | null} The size of the element or null if not available
 */
export const useElementSize = <T extends HTMLElement>({
	element,
}: HookProps<T>): {
	elementWidth: number;
	elementHeight: number;
} | null => {
	const [elementParams, setElemntParams] = useState<{
		elementWidth: number;
		elementHeight: number;
	} | null>(null);
	useLayoutEffect(() => {
		if (!element || !element.current) return;

		const getElementParams = () => {
			if (!element.current) return null;
			return {
				elementWidth: element.current.offsetWidth,
				elementHeight: element.current.offsetHeight,
			};
		};
		setElemntParams(getElementParams());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return elementParams;
};
