import { useLayoutEffect, useRef } from 'react';

/**
 * A hook that returns a ref object with the latest value.
 * This is useful when you need to access the latest value of a prop or state
 * inside an effect callback, without re-running the effect.
 *
 * @param value - The value to keep track of
 * @returns A ref object containing the latest value
 */

export function useLatest<Value>(value: Value) {
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    valueRef.current = value;
  });

  return valueRef;
}
