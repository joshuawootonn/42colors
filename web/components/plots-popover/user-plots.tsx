"use client";

import { useInfiniteUserPlots } from "@/lib/tools/claimer/claimer.rest";
import { useMemo } from "react";

import { PlotsList } from "./plots-list";

interface UserPlotsProps {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
  userId?: number;
}

export function UserPlots({ selectedPlotId, selectPlot, enabled = true, userId }: UserPlotsProps) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteUserPlots({
      enabled: enabled && userId != null,
    });

  const userPlots = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  // If user is not authenticated, show a message encouraging them to create an account
  if (userId == null) {
    return (
      <div className="flex-1 text-pretty pt-20 text-center text-sm text-muted-foreground">
        Create an account to claim a plot
      </div>
    );
  }

  return (
    <PlotsList
      plots={userPlots}
      isLoading={isLoading}
      error={error}
      selectedPlotId={selectedPlotId}
      selectPlot={selectPlot}
      emptyMessage="No user plots found"
      loadingMessage="Loading user plots..."
      onLoadMore={() => fetchNextPage()}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
    />
  );
}
