"use client";

import { useEffect, useRef } from "react";

import { Plot } from "@/lib/tools/claimer/claimer.rest";
import { openUserProfile } from "@/lib/user-profile-popover-state";
import { cn } from "@/lib/utils";
import { Button } from "@base-ui/react/button";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PlotsListProps {
  plots: Plot[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function PlotsList({
  plots,
  isLoading,
  error,
  selectedPlotId,
  selectPlot,
  emptyMessage = "No plots found",
  loadingMessage = "Loading plots...",
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: PlotsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedPlotRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPlotId && containerRef.current && selectedPlotRef.current) {
      const selectedElement = selectedPlotRef.current;

      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedPlotId]);

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  if (isLoading) {
    return (
      <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">{loadingMessage}</div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 pt-20 text-center text-sm text-red-600">Failed to load plots</div>
    );
  }

  if (plots == null || plots.length === 0) {
    return (
      <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <div ref={containerRef} className="flex w-full flex-col">
      {plots.map((plot) => {
        const displayUsername = plot.username || `User #${plot.userId}`;
        return (
          <div
            key={plot.id}
            className="relative"
            ref={selectedPlotId === plot.id ? selectedPlotRef : null}
          >
            <button
              className={cn(
                "svg-outline-inset group peer relative z-0 flex w-full items-start justify-between gap-2 border-transparent bg-transparent p-2 text-left text-foreground outline-none",
                selectedPlotId === plot.id && "bg-secondary",
              )}
              onClick={() => selectPlot(plot.id)}
              disabled={!plot.polygon}
            >
              <div className="min-w-0 flex-1">
                <div>{plot.name}</div>
                <div className="text-left text-xs">
                  {plot.description && (
                    <div className="mt-0.5 line-clamp-2 text-muted-foreground">
                      {plot.description}
                    </div>
                  )}
                  <div className="mt-1 text-muted-foreground">
                    <Button
                      render={<span />}
                      nativeButton={false}
                      className={cn(
                        "relative z-10 svg-outline-sm text-left text-xs text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserProfile(
                          plot.userId,
                          plot.username,
                          e.currentTarget.getBoundingClientRect(),
                        );
                      }}
                    >
                      {displayUsername}
                    </Button>{" "}
                    · {formatDate(plot.insertedAt)}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-sm tabular-nums text-muted-foreground">
                <span className="pr-0.5">↑</span>
                {plot.score}
              </div>
            </button>
          </div>
        );
      })}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
      {isLoadingMore && (
        <div className="py-4 text-center text-sm text-muted-foreground">Loading more...</div>
      )}
    </div>
  );
}
