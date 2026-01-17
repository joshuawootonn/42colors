"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="mb-4 text-xl font-bold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
