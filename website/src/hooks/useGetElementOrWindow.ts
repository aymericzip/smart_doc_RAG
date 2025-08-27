import { useMemo } from "react";

/**
 * Hook that returns either the provided element or document.body
 * @param element - The element to return, or undefined to return document.body
 * @returns The element or document.body
 */
export const useGetElementOrWindow = (element?: HTMLElement | null) => {
  return useMemo(() => {
    if (element) {
      return element;
    }

    // Return document.body if we're in a browser environment
    if (
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      document.body
    ) {
      return document.body;
    }

    return null;
  }, [element]);
};
