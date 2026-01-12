"use client";

import { load, trackPageview } from "fathom-client";

import { Suspense, useEffect } from "react";

import { usePathname, useSearchParams } from "next/navigation";

function TrackPageView() {
  const pathname = usePathname();

  // Load the Fathom script on mount
  useEffect(() => {
    load(process.env.NEXT_PUBLIC_FATHOM_ID ?? "", {
      url: process.env.NEXT_PUBLIC_FATHOM_URL,
    });
  }, []);

  // Record a pageview when route changes (excluding search param changes)
  useEffect(() => {
    if (!pathname) return;

    trackPageview({
      url: pathname,
      referrer: document.referrer,
    });
  }, [pathname]);

  return null;
}

export function Fathom() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
