"use client";

import { useSoliDeoGloria } from "@/components/use-soli-deo-gloria";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  useSoliDeoGloria();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
