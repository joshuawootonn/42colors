import { Canvas } from "@/lib/canvas";
import {
  ReactNode,
  useContext,
  createContext,
  DependencyList,
  useMemo,
  useCallback,
  useSyncExternalStore,
  useId,
} from "react";

const CanvasContext = createContext<Canvas | null>(null);

type Props = {
  canvas: Canvas;
  children: ReactNode;
};

export function CanvasProvider({ canvas, children }: Props): JSX.Element {
  return (
    <CanvasContext.Provider value={canvas}>{children}</CanvasContext.Provider>
  );
}

export function useCanvas(): Canvas {
  const builder = useContext(CanvasContext);

  if (builder == null) {
    throw new Error(
      "A canvas must be provided via context when using `useCanvas`",
    );
  }

  return builder;
}

export function useCanvasSubscription<T>(
  getCurrentValue: (builder: Canvas) => T,
  deps: DependencyList,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedGetCurrentValue = useMemo(() => getCurrentValue, deps);
  const id = useId();
  const canvas = useCanvas();

  const getSnapshot = useCallback(
    () => memoizedGetCurrentValue(canvas),
    [canvas, memoizedGetCurrentValue],
  );

  const subscribe = useCallback(
    (callback: () => void) => {
      let lastValue = memoizedGetCurrentValue(canvas);

      return canvas.subscribe(id, () => {
        const nextValue = memoizedGetCurrentValue(canvas);
        if (!Object.is(lastValue, nextValue)) {
          lastValue = nextValue;

          callback();
        }
      });
    },
    [canvas, id, memoizedGetCurrentValue],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
