"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

let currentZIndex = 50;

function getNextZIndex(): number {
  return ++currentZIndex;
}

const OverlayZIndexContext = createContext<number>(50);

export function useOverlayZIndex(): number {
  return useContext(OverlayZIndexContext);
}

type OverlayZIndexProviderProps = {
  isOpen: boolean;
  children: React.ReactNode;
};

export function OverlayZIndexProvider({ isOpen, children }: OverlayZIndexProviderProps) {
  const [zIndex, setZIndex] = useState<number>(50);

  useEffect(() => {
    if (isOpen) {
      setZIndex(getNextZIndex());
    }
  }, [isOpen]);

  return <OverlayZIndexContext.Provider value={zIndex}>{children}</OverlayZIndexContext.Provider>;
}
