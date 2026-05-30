import { useCallback, useEffect, useRef, useState } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Hook that uses ResizeObserver to track the dimensions of a DOM element.
 * Returns `{ width, height, ref }` — attach `ref` to the container element.
 */
export function useContainerSize(): ContainerSize & { ref: (node: HTMLElement | null) => void } {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    nodeRef.current = node;

    if (!node) return;

    // Measure immediately
    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    // Observe future resizes
    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize((prev) => {
          if (prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }
    });

    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ...size, ref };
}
