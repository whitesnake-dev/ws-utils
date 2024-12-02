import { useEffect, useState } from 'react';

type Axis = 'x' | 'y' | 'both';
type ScrollPosition = {
	x: number | null;
	y: number | null;
};

/**
 * Hook that tracks the window scroll position along specified axis.
 *
 * @param {Axis} axis - Axis to track: 'x', 'y', or 'both' (default: 'y')
 * @returns {ScrollPosition} Object containing current scroll positions:
 * - For tracked axes: number value in pixels
 * - For untracked axes: null
 *
 * @example
 * // Track vertical scroll - returns { x: null, y: number }
 * const { y } = useScrollPosition('y');
 *
 * // Track horizontal scroll - returns { x: number, y: null }
 * const { x } = useScrollPosition('x');
 *
 * // Track both axes - returns { x: number, y: number }
 * const { x, y } = useScrollPosition('both');
 */
export const useScrollPosition = (axis: Axis = 'y'): ScrollPosition => {
	const [position, setPosition] = useState<ScrollPosition>(() => ({
		x: axis === 'y' ? null : window.scrollX,
		y: axis === 'x' ? null : window.scrollY,
	}));

	useEffect(() => {
		const updatePosition = () => {
			setPosition({
				x: axis === 'y' ? null : window.scrollX,
				y: axis === 'x' ? null : window.scrollY,
			});
		};

		window.addEventListener('scroll', updatePosition);
		updatePosition();

		return () => window.removeEventListener('scroll', updatePosition);
	}, [axis]);

	return position;
};
