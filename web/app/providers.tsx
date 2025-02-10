"use client";

import { useSoliDeoGloria } from "@/components/use-soli-deo-gloria";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useSoliDeoGloria();

  return children;
}
