import { KeyboardEventHandler, useCallback } from 'react';

type UseKeySelectionProps = {
  /**
   * Function to be called when a key selection is triggered (e.g., Enter or Space key).
   */
  onSelect: () => void;

  /**
   * Determines whether the key selection is currently active.
   * If `true`, the selection will not trigger.
   * @default false
   */
  isActive?: boolean;
};

/**
 * A React hook that provides a keyboard event handler to trigger actions
 * on specific key presses (e.g., Enter or Space).
 *
 * This is useful for managing accessibility and keyboard interactions
 * in React components.
 *
 * @param {UseKeySelectionProps} props - Configuration options for the hook.
 * @returns {KeyboardEventHandler} A keyboard event handler to attach to an element.
 */
export const useKeySelection = ({
  onSelect,
  isActive = false,
}: UseKeySelectionProps): KeyboardEventHandler => {
  return useCallback(
    (event) => {
      if (isActive) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
      }
    },
    [onSelect, isActive]
  );
};
