"use client";

import { useInfiniteRecentPlots } from "@/lib/plots/plots.rest";
import { useMemo } from "react";

import { PlotsList } from "./plots-list";

interface RecentPlotsProps {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
}

export function RecentPlots({ selectedPlotId, selectPlot, enabled = true }: RecentPlotsProps) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteRecentPlots({
      enabled,
    });

  const plots = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  return (
    <PlotsList
      plots={plots}
      isLoading={isLoading}
      error={error}
      selectedPlotId={selectedPlotId}
      selectPlot={selectPlot}
      emptyMessage="No plots found"
      loadingMessage="Loading plots..."
      onLoadMore={() => fetchNextPage()}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
    />
  );
}
