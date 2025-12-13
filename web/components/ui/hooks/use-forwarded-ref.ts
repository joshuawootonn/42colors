import { useCallback } from "react";

export function useForwardedRef<T>(
  internalRef: React.MutableRefObject<T | null>,
  forwardedRef: React.ForwardedRef<T>,
) {
  return useCallback(
    (node: T | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [internalRef, forwardedRef],
  );
}
