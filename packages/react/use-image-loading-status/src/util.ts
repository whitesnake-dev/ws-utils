import { useLayoutEffect, useState } from 'react';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Custom hook to manage the loading status of an image.
 *
 * @param {string} [src] - The source URL of the image.
 * @returns {ImageLoadingStatus} - The current loading status of the image.
 */

export function useImageLoadingStatus(src?: string) {
  const [status, setStatus] = useState<ImageLoadingStatus>('idle');

  useLayoutEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }

    const isMounted = true;
    const img = new window.Image();

    const updateStatus = (status: ImageLoadingStatus) => {
      if (!isMounted) return;
      setStatus(status);
    };

    setStatus('loading');

    img.onload = () => {
      img.naturalWidth > 0 && img.naturalHeight > 0 && img.complete && updateStatus('loaded');
    };
    img.onerror = () => updateStatus('error');
    img.src = src;
  }, [src]);

  return status;
}
