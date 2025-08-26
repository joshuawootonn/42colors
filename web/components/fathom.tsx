'use client';

import { load, trackPageview } from 'fathom-client';

import { Suspense, useEffect, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { SquirrelStats } from '@squirrel-stats/client';

function TrackPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [squirrelStatsClient, setSquirrelStatsClient] =
        useState<SquirrelStats | null>(null);

    // Load the Fathom script on mount
    useEffect(() => {
        load(process.env.NEXT_PUBLIC_FATHOM_ID ?? '', {
            url: process.env.NEXT_PUBLIC_FATHOM_URL,
        });
        setSquirrelStatsClient(
            new SquirrelStats(process.env.NEXT_PUBLIC_SQUIRREL_STATS_ID!),
        );
    }, []);

    // Record a pageview when route changes
    useEffect(() => {
        if (!pathname) return;

        trackPageview({
            url: pathname + searchParams?.toString(),
            referrer: document.referrer,
        });
        squirrelStatsClient?.trackPageview();
    }, [pathname, searchParams, squirrelStatsClient]);

    return null;
}

export function Fathom() {
    return (
        <Suspense fallback={null}>
            <TrackPageView />
        </Suspense>
    );
}
