'use client';

import { ReactNode } from 'react';

import { useSoliDeoGloria } from '@/components/use-soli-deo-gloria';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    useSoliDeoGloria();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
