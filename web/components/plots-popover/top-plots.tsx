"use client";

import { useTopPlots } from "@/lib/plots/plots.rest";

import { PlotsList } from "./plots-list";

const PAGE_SIZE = 20;

type TopPlotsProps = {
  selectedPlotId: number | undefined;
  selectPlot: (plotId: number) => void;
  enabled?: boolean;
};

export function TopPlots({ selectedPlotId, selectPlot, enabled = true }: TopPlotsProps) {
  const { data: plots, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTopPlots(PAGE_SIZE, {
      enabled,
    });

  return (
    <PlotsList
      plots={plots}
      isLoading={isLoading}
      error={error}
      selectedPlotId={selectedPlotId}
      selectPlot={selectPlot}
      emptyMessage="No plots found"
      loadingMessage="Loading top plots..."
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
