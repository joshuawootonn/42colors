"use client";

import { useInfiniteTopPlots } from "@/lib/plots/plots.rest";
import { useMemo } from "react";

import { PlotsList } from "./plots-list";

type TopPlotsProps = {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
};

export function TopPlots({ selectedPlotId, selectPlot, enabled = true }: TopPlotsProps) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteTopPlots({
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
      loadingMessage="Loading top plots..."
      onLoadMore={() => fetchNextPage()}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
    />
  );
}
